package com.functions.events.services;


import java.math.BigInteger;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.handlers.CreateEventHandler;
import com.functions.events.models.Attendee;
import com.functions.events.models.EventMetadata;
import com.functions.events.models.NewEventData;
import com.functions.events.models.Purchaser;
import com.functions.events.models.RecurrenceData;
import com.functions.events.models.RecurrenceTemplate;
import com.functions.events.models.ReservedSlot;
import com.functions.events.repositories.RecurrenceTemplateRepository;
import com.functions.firebase.services.FirebaseService;
import com.functions.utils.JavaUtils;
import com.functions.utils.TimeUtils;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;
import com.google.cloud.firestore.WriteResult;

import static com.functions.firebase.services.FirebaseService.CollectionPaths.EVENTS_METADATA;

public class RecurringEventsCronService {
    private static final Logger logger = LoggerFactory.getLogger(RecurringEventsCronService.class);

    public static List<String> createEventsFromRecurrenceTemplates(LocalDate today) throws Exception {
        return createEventsFromRecurrenceTemplates(today, null, false);
    }

    public static List<String> createEventsFromRecurrenceTemplates(LocalDate today, String targetRecurrenceTemplateId, boolean createEventWorkflow) throws Exception {
        logger.info("Creating events from recurrence templates. today: {}, targetRecurrenceTemplateId: {}, targetRecurrenceTemplate: {}, createEventWorkflow: {}", today, targetRecurrenceTemplateId, createEventWorkflow);
        Set<String> activeRecurrenceTemplateIds;
        if (targetRecurrenceTemplateId == null) {
            activeRecurrenceTemplateIds = RecurrenceTemplateRepository.getAllActiveRecurrenceTemplateIds();
        } else {
            activeRecurrenceTemplateIds = Set.of(targetRecurrenceTemplateId);
        }

        logger.info("All Active Recurrence Template Ids {}", activeRecurrenceTemplateIds);
        List<String> moveToInactiveRecurringEvents = new ArrayList<>();

        List<String> createdEventIds = new ArrayList<>();
        
        // Track events that need reserved slots added (processed after main transaction)
        Map<String, List<ReservedSlot>> eventsNeedingReservedSlots = new HashMap<>();

        for (String recurrenceTemplateId : activeRecurrenceTemplateIds) {

            // Create new transaction
            FirebaseService.createFirestoreTransaction(transaction -> {
                Optional<RecurrenceTemplate> maybeRecurrenceTemplate = RecurrenceTemplateRepository.getRecurrenceTemplate(recurrenceTemplateId, transaction);
                if (maybeRecurrenceTemplate.isEmpty()) {
                    logger.warn("Recurrence template not found for id: {} during transaction. Skipping processing of this recurring event to avoid TOCTOU failures.",
                            recurrenceTemplateId);
                    return true; // Continue processing other templates in the batch
                }

                RecurrenceTemplate recurrenceTemplate = maybeRecurrenceTemplate.get();
                logger.debug("Creating recurring event from recurrence template data: {}", recurrenceTemplate);
                NewEventData newEventData = recurrenceTemplate.getEventData();
                RecurrenceData recurrenceData = recurrenceTemplate.getRecurrenceData();
                Map<String, String> pastRecurrences = new HashMap<>(recurrenceData.getPastRecurrences());

                boolean isStillActiveRecurrenceFlag = false;
                List<Timestamp> allRecurrences = recurrenceData.getAllRecurrences();

                if (createEventWorkflow) {
                    // Find the first recurrence that hasn't been created yet
                    Timestamp nextUncreatedRecurrence = null;
                    for (Timestamp ts : allRecurrences) {
                        String tsString = TimeUtils.getTimestampStringFromTimezone(ts, ZoneId.of("Australia/Sydney"));
                        if (!pastRecurrences.containsKey(tsString)) {
                            nextUncreatedRecurrence = ts;
                            break;
                        }
                    }
                    if (nextUncreatedRecurrence != null) {
                        allRecurrences = List.of(nextUncreatedRecurrence);
                    } else {
                        logger.info("All recurrences already created for template: {}", recurrenceTemplateId);
                        allRecurrences = List.of(); // Empty list - nothing to create
                    }
                }

                for (Timestamp recurrenceTimestamp : allRecurrences) {
                    logger.info("Recurrence Timestamp: {}", recurrenceTimestamp);
                    String recurrenceTimestampString = TimeUtils.getTimestampStringFromTimezone(recurrenceTimestamp, ZoneId.of("Australia/Sydney"));
                    LocalDate eventCreationDate = TimeUtils.convertTimestampToLocalDateTime(recurrenceTimestamp).toLocalDate()
                            .minusDays(recurrenceData.getCreateDaysBefore());
                    logger.info("Event Creation Date: {}", eventCreationDate);
                    if (!pastRecurrences.containsKey(recurrenceTimestampString) && (today.equals(eventCreationDate) || createEventWorkflow) && (recurrenceTemplate.getRecurrenceData().getRecurrenceEnabled())) {
                        logger.info("Creating event for recurrence template: {} for recurrence timestamp: {}", recurrenceTemplateId, recurrenceTimestampString);
                        NewEventData newEventDataDeepCopy = JavaUtils.deepCopy(newEventData, NewEventData.class);
                        long eventLengthMillis = newEventDataDeepCopy.getEndDate().toSqlTimestamp().getTime() - newEventDataDeepCopy.getStartDate().toSqlTimestamp().getTime();
                        long eventDeadlineDeltaMillis = newEventDataDeepCopy.getRegistrationDeadline().toSqlTimestamp().getTime() - newEventDataDeepCopy.getStartDate().toSqlTimestamp().getTime();
                        newEventDataDeepCopy.setStartDate(recurrenceTimestamp);
                        Timestamp newEndDate = Timestamp.ofTimeMicroseconds((recurrenceTimestamp.toSqlTimestamp().getTime() + eventLengthMillis) * 1000);
                        Timestamp newRegistrationDeadline = Timestamp.ofTimeMicroseconds((recurrenceTimestamp.toSqlTimestamp().getTime() + eventDeadlineDeltaMillis) * 1000);
                        newEventDataDeepCopy.setEndDate(newEndDate);
                        newEventDataDeepCopy.setRegistrationDeadline(newRegistrationDeadline);

                        // Apply reserved slots - reduce vacancy
                        List<ReservedSlot> reservedSlots = recurrenceData.getReservedSlots();
                        int totalReservedSlots = 0;
                        if (reservedSlots != null && !reservedSlots.isEmpty()) {
                            // Validate and normalize: filter out null slots and null/negative slot counts
                            reservedSlots = reservedSlots.stream()
                                    .filter(slot -> slot != null)
                                    .filter(slot -> slot.getSlots() != null && slot.getSlots() > 0)
                                    .collect(Collectors.toList());
                            
                            if (!reservedSlots.isEmpty()) {
                                totalReservedSlots = reservedSlots.stream()
                                        .mapToInt(ReservedSlot::getSlots)
                                        .sum();
                                int currentVacancy = newEventDataDeepCopy.getVacancy();
                                
                                // Backend validation: cap reserved slots to available capacity
                                if (totalReservedSlots > currentVacancy) {
                                    logger.warn("Reserved slots ({}) exceed vacancy ({}). Capping to available capacity.", 
                                            totalReservedSlots, currentVacancy);
                                    // Filter reserved slots to fit within capacity and recompute total
                                    reservedSlots = capReservedSlotsToCapacity(reservedSlots, currentVacancy);
                                    totalReservedSlots = reservedSlots.stream()
                                            .mapToInt(ReservedSlot::getSlots)
                                            .sum();
                                }
                                
                                int newVacancy = currentVacancy - totalReservedSlots;
                                newEventDataDeepCopy.setVacancy(newVacancy);
                                logger.info("Applied {} reserved slots to event. Vacancy reduced from {} to {}",
                                        totalReservedSlots, currentVacancy, newVacancy);
                            }
                        }

                        String newEventId = CreateEventHandler.createEvent(newEventDataDeepCopy, transaction);

                        logger.info("New event id: {}", newEventId);
                        createdEventIds.add(newEventId);
                        
                        // Track reserved slots for processing after transaction completes
                        // (Firestore requires all reads before writes, so we can't update eventMetadata here)
                        if (reservedSlots != null && !reservedSlots.isEmpty()) {
                            eventsNeedingReservedSlots.put(newEventId, new ArrayList<>(reservedSlots));
                        }
                        pastRecurrences.put(recurrenceTimestampString, newEventId);

                        // Update custom event links references
                        try {
                            CustomEventLinksService.updateEventLinksPointedToRecurrence(newEventDataDeepCopy.getOrganiserId(), recurrenceTemplateId, newEventId);
                        } catch (Exception e) {
                            logger.error("Failed to update custom event links for recurrence template {}: {}", recurrenceTemplateId, e.getMessage());
                            // Continue with event creation even if custom links update fails
                        }

                        // Add event to event collections that contain the recurrence template
                        try {
                            EventCollectionsService.addEventToEventCollectionsWithRecurrenceTemplate(recurrenceTemplateId, newEventId);
                        } catch (Exception e) {
                            logger.error("Failed to add event to event collection for recurrence template {}: {}", recurrenceTemplateId, e.getMessage());
                            // Continue with event creation even if event collection update fails
                        }
                    }

                    if (!recurrenceData.getAllRecurrences().isEmpty()) {
                        Timestamp latestTimestamp = Collections.max(recurrenceData.getAllRecurrences(), Timestamp::compareTo);
                        LocalDate finalEventCreationDate = TimeUtils.convertTimestampToLocalDateTime(latestTimestamp).toLocalDate().minusDays(recurrenceData.getCreateDaysBefore());
                        if (today.isBefore(finalEventCreationDate)) {
                            isStillActiveRecurrenceFlag = true;
                        }
                    }
                }
                RecurrenceData newRecurrenceData = recurrenceData.toBuilder().pastRecurrences(pastRecurrences).build();
                logger.info("New Recurrence Data {}", newRecurrenceData.getPastRecurrences());
                RecurrenceTemplate newRecurrenceTemplate = recurrenceTemplate.toBuilder().recurrenceData(newRecurrenceData).build();

                RecurrenceTemplateRepository.updateRecurrenceTemplate(recurrenceTemplateId, newRecurrenceTemplate, transaction);

                if (!isStillActiveRecurrenceFlag) {
                    moveToInactiveRecurringEvents.add(recurrenceTemplateId);
                }
                return true;
            });
        }

        // Process reserved slots in separate transactions (after event creation transactions complete)
        for (Map.Entry<String, List<ReservedSlot>> entry : eventsNeedingReservedSlots.entrySet()) {
            String eventId = entry.getKey();
            List<ReservedSlot> reservedSlots = entry.getValue();
            
            boolean success = false;
            Exception lastException = null;
            int maxRetries = 3;
            
            // Bounded retry attempts
            for (int attempt = 1; attempt <= maxRetries && !success; attempt++) {
                try {
                    FirebaseService.createFirestoreTransaction(transaction -> {
                        addReservedSlotsAsAttendees(eventId, reservedSlots, transaction);
                        return null;
                    });
                    success = true;
                    logger.info("Successfully added reserved slots as attendees for event {} on attempt {}", eventId, attempt);
                } catch (Exception e) {
                    lastException = e;
                    logger.warn("Attempt {}/{} failed to add reserved slots for event {}: {}", 
                            attempt, maxRetries, eventId, e.getMessage());
                    if (attempt < maxRetries) {
                        try {
                            // Exponential backoff: 100ms, 200ms, 400ms...
                            Thread.sleep(100L * (1L << (attempt - 1)));
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                    }
                }
            }
            
            // If all retries failed, persist for reconciliation
            if (!success && lastException != null) {
                String reconciliationId = persistReservedSlotsReconciliation(eventId, reservedSlots, lastException);
                logger.error("All {} retry attempts failed to add reserved slots for event {}. " +
                        "Persisted reconciliation record: {}. Error: {}", 
                        maxRetries, eventId, reconciliationId, lastException.getMessage(), lastException);
            }
        }

        for (String recurringEventId : moveToInactiveRecurringEvents) {
            FirebaseService.createFirestoreTransaction(transaction -> {
                moveRecurringEventToInactive(recurringEventId, transaction);
                return null;
            });
        }

        return createdEventIds;
    }

    private static void moveRecurringEventToInactive(String recurrenceId, Transaction transaction) throws Exception {
        // Get the Recurrence Template from firestore with transaction first
        Optional<RecurrenceTemplate> maybeRecurrenceTemplate = RecurrenceTemplateRepository.getRecurrenceTemplate(recurrenceId, transaction);
        if (maybeRecurrenceTemplate.isEmpty()) {
            throw new Exception("Recurrence template does not exist: " + recurrenceId);
        }

        // Mutate the template accordingly to InActive and turn off recurrence
        RecurrenceTemplate oldRecurrenceTemplate = maybeRecurrenceTemplate.get();
        NewEventData newEventData = oldRecurrenceTemplate.getEventData();
        newEventData.setIsActive(false);
        RecurrenceData newRecurrenceData = oldRecurrenceTemplate.getRecurrenceData().toBuilder().recurrenceEnabled(false).build();

        RecurrenceTemplate newRecurrenceTemplate = oldRecurrenceTemplate.toBuilder()
                .eventData(newEventData)
                .recurrenceData(newRecurrenceData)
                .build();

        // Copy the template over to InActive and delete from Active
        try {
            RecurrenceTemplateRepository.updateRecurrenceTemplate(recurrenceId, newRecurrenceTemplate, transaction);
            RecurrenceTemplateRepository.deleteRecurrenceTemplate(recurrenceId, true, newEventData.getIsPrivate(), transaction);
        } catch (Exception e) {
            logger.error("Unable to move Recurrence Template {}", recurrenceId, e);
        }
    }

    /**
     * Adds reserved slots as actual attendees in the event metadata purchaserMap.
     * This makes them visible in the "Manage Attendees" view.
     * Must be called in its own transaction (separate from event creation).
     */
    private static void addReservedSlotsAsAttendees(String eventId, List<ReservedSlot> reservedSlots, Transaction transaction) throws Exception {
        Firestore db = FirebaseService.getFirestore();
        DocumentReference eventMetadataDocRef = db.collection(EVENTS_METADATA).document(eventId);
        
        // Read first (Firestore requires all reads before writes)
        EventMetadata eventMetadata = transaction.get(eventMetadataDocRef).get().toObject(EventMetadata.class);

        if (eventMetadata == null) {
            throw new Exception("Event metadata not found for eventId: " + eventId);
        }

        Map<String, Purchaser> purchaserMap = eventMetadata.getPurchaserMap();
        if (purchaserMap == null) {
            purchaserMap = new HashMap<>();
        }

        int totalTicketsAdded = 0;

        for (ReservedSlot reservedSlot : reservedSlots) {
            String email = reservedSlot.getEmail();
            String name = reservedSlot.getName();
            Integer slots = reservedSlot.getSlots();

            // Validate required fields (matches frontend addEventAttendee validation)
            if (email == null || email.trim().isEmpty() || 
                name == null || name.trim().isEmpty() || 
                slots == null || slots <= 0) {
                logger.warn("Skipping invalid reserved slot: {}", reservedSlot);
                continue;
            }

            email = email.toLowerCase().trim();
            name = name.trim();

            String emailHash = getEmailHash(email);

            // Create attendee info
            Attendee attendee = new Attendee();
            attendee.setPhone(""); // No phone for reserved slots
            attendee.setTicketCount(slots);

            // Check if purchaser already exists for this email (aggregation logic)
            if (purchaserMap.containsKey(emailHash)) {
                Purchaser existingPurchaser = purchaserMap.get(emailHash);
                Map<String, Attendee> attendees = existingPurchaser.getAttendees();
                if (attendees == null) {
                    attendees = new HashMap<>();
                }
                // Add or update attendee under this purchaser
                if (attendees.containsKey(name)) {
                    // Same email + same name: aggregate tickets
                    Attendee existingAttendee = attendees.get(name);
                    existingAttendee.setTicketCount(existingAttendee.getTicketCount() + slots);
                } else {
                    // Same email + different name: add new attendee
                    attendees.put(name, attendee);
                }
                existingPurchaser.setAttendees(attendees);
                existingPurchaser.setTotalTicketCount(existingPurchaser.getTotalTicketCount() + slots);
            } else {
                // Create new purchaser
                Purchaser purchaser = new Purchaser();
                purchaser.setEmail(email);
                Map<String, Attendee> attendees = new HashMap<>();
                attendees.put(name, attendee);
                purchaser.setAttendees(attendees);
                purchaser.setTotalTicketCount(slots);
                purchaserMap.put(emailHash, purchaser);
            }

            totalTicketsAdded += slots;
            logger.info("Added reserved slot as attendee: email={}, name={}, slots={}", email, name, slots);
        }

        // Write after all reads are done
        eventMetadata.setPurchaserMap(purchaserMap);
        eventMetadata.setCompleteTicketCount(eventMetadata.getCompleteTicketCount() + totalTicketsAdded);
        transaction.set(eventMetadataDocRef, eventMetadata);

        logger.info("Successfully added {} reserved slots ({} tickets) as attendees for event {}", 
                reservedSlots.size(), totalTicketsAdded, eventId);
    }

    /**
     * Computes the email hash matching the frontend getPurchaserEmailHash function.
     * MD5 hash converted to BigInteger string.
     */
    private static String getEmailHash(String email) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(email.getBytes());
            BigInteger bigInt = new BigInteger(1, digest);
            return bigInt.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("MD5 algorithm not available", e);
        }
    }

    /**
     * Caps reserved slots to fit within the available capacity.
     * Processes slots in order, reducing or skipping slots that would exceed capacity.
     */
    private static List<ReservedSlot> capReservedSlotsToCapacity(List<ReservedSlot> reservedSlots, int maxCapacity) {
        List<ReservedSlot> cappedSlots = new ArrayList<>();
        int remainingCapacity = Math.max(0, maxCapacity);

        for (ReservedSlot slot : reservedSlots) {
            // Skip null slots or slots with null/non-positive slot counts
            if (slot == null || slot.getSlots() == null || slot.getSlots() <= 0) {
                continue;
            }
            
            if (remainingCapacity <= 0) {
                logger.warn("Skipping reserved slot for {} - no capacity remaining", slot.getEmail());
                break;
            }

            int slotsToAdd = Math.min(slot.getSlots(), remainingCapacity);
            if (slotsToAdd < slot.getSlots()) {
                logger.warn("Reducing reserved slots for {} from {} to {} due to capacity limit",
                        slot.getEmail(), slot.getSlots(), slotsToAdd);
            }

            ReservedSlot cappedSlot = new ReservedSlot();
            cappedSlot.setEmail(slot.getEmail());
            cappedSlot.setName(slot.getName());
            cappedSlot.setSlots(slotsToAdd);
            cappedSlots.add(cappedSlot);

            remainingCapacity -= slotsToAdd;
        }

        return cappedSlots;
    }

    /**
     * Persists a failed reserved slots operation to a reconciliation collection for later retry/resolution.
     * This ensures that even if adding reserved slots as attendees fails, the data is not lost
     * and can be reconciled later.
     *
     * @param eventId The event ID that the reserved slots were meant for
     * @param reservedSlots The list of reserved slots that failed to be added
     * @param exception The exception that caused the failure
     * @return The reconciliation document ID for tracking
     */
    private static String persistReservedSlotsReconciliation(String eventId, List<ReservedSlot> reservedSlots, Exception exception) {
        try {
            Firestore db = FirebaseService.getFirestore();
            DocumentReference reconciliationDocRef = db.collection("ReservedSlotsReconciliation").document();
            
            Map<String, Object> reconciliationData = new HashMap<>();
            reconciliationData.put("eventId", eventId);
            reconciliationData.put("status", "PENDING");
            reconciliationData.put("createdAt", Timestamp.now());
            reconciliationData.put("errorMessage", exception.getMessage());
            reconciliationData.put("errorType", exception.getClass().getSimpleName());
            reconciliationData.put("retryCount", 0);
            
            // Convert reserved slots to a list of maps for Firestore storage
            List<Map<String, Object>> slotsData = new ArrayList<>();
            for (ReservedSlot slot : reservedSlots) {
                Map<String, Object> slotMap = new HashMap<>();
                slotMap.put("email", slot.getEmail());
                slotMap.put("name", slot.getName());
                slotMap.put("slots", slot.getSlots());
                slotsData.add(slotMap);
            }
            reconciliationData.put("reservedSlots", slotsData);
            
            WriteResult writeResult = reconciliationDocRef.set(reconciliationData).get();
            logger.info("Persisted reconciliation record {} for event {} at {}", 
                    reconciliationDocRef.getId(), eventId, writeResult.getUpdateTime());
            
            return reconciliationDocRef.getId();
        } catch (Exception e) {
            // If we can't even persist the reconciliation record, log everything we can
            logger.error("CRITICAL: Failed to persist reconciliation record for event {}. " +
                    "Reserved slots data: {}. Original error: {}. Reconciliation error: {}", 
                    eventId, reservedSlots, exception.getMessage(), e.getMessage(), e);
            return "FAILED_TO_PERSIST";
        }
    }
}
