package com.functions.events.services;


import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.handlers.CreateEventHandler;
import com.functions.events.models.NewEventData;
import com.functions.events.models.RecurrenceData;
import com.functions.events.models.RecurrenceTemplate;
import com.functions.events.models.ReservedSlot;
import com.functions.events.repositories.RecurrenceTemplateRepository;
import com.functions.events.utils.EventIdGenerator;
import com.functions.events.utils.EventTimeZone;
import com.functions.firebase.services.FirebaseService;
import com.functions.utils.JavaUtils;
import com.functions.utils.TimeUtils;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Transaction;

public class RecurringEventsCronService {
    private static final Logger logger = LoggerFactory.getLogger(RecurringEventsCronService.class);
    private static final ZoneId SYDNEY_TIMEZONE = ZoneId.of("Australia/Sydney");

    public static List<String> createEventsFromRecurrenceTemplates(LocalDate today) throws Exception {
        return createEventsFromRecurrenceTemplates(today, null, false);
    }

    public static List<String> createEventsFromRecurrenceTemplates(LocalDate today, String targetRecurrenceTemplateId, boolean createEventWorkflow) throws Exception {
        EventTimeZone.warm();
        logger.info("Creating events from recurrence templates. today: {}, targetRecurrenceTemplateId: {}, targetRecurrenceTemplate: {}, createEventWorkflow: {}", today, targetRecurrenceTemplateId, createEventWorkflow);
        Set<String> activeRecurrenceTemplateIds;
        if (targetRecurrenceTemplateId == null) {
            activeRecurrenceTemplateIds = RecurrenceTemplateRepository.getAllActiveRecurrenceTemplateIds();
        } else {
            activeRecurrenceTemplateIds = Set.of(targetRecurrenceTemplateId);
        }

        logger.info("All Active Recurrence Template Ids {}", activeRecurrenceTemplateIds);
        List<String> moveToInactiveRecurringEvents = new ArrayList<>();
        List<CreatedRecurringEvent> createdEvents = new ArrayList<>();

        for (String recurrenceTemplateId : activeRecurrenceTemplateIds) {
            RecurrenceTemplateProcessingResult result = processRecurrenceTemplate(
                    recurrenceTemplateId, today, createEventWorkflow);
            createdEvents.addAll(result.createdEvents());
            if (result.moveToInactive()) {
                moveToInactiveRecurringEvents.add(recurrenceTemplateId);
            }
        }

        processReservedSlots(createdEvents);

        for (String recurringEventId : moveToInactiveRecurringEvents) {
            FirebaseService.createFirestoreTransaction(transaction -> {
                moveRecurringEventToInactive(recurringEventId, transaction);
                return null;
            });
        }

        return createdEvents.stream().map(CreatedRecurringEvent::eventId).toList();
    }

    private static RecurrenceTemplateProcessingResult processRecurrenceTemplate(
            String recurrenceTemplateId, LocalDate today, boolean createEventWorkflow) throws Exception {
        Map<String, String> eventIdsByRecurrence = new HashMap<>();
        List<CreatedRecurringEvent> createdEvents = new ArrayList<>();

        do {
            RecurrenceTransactionResult transactionResult = FirebaseService.createFirestoreTransaction(transaction -> {
                    Optional<RecurrenceTemplate> maybeRecurrenceTemplate =
                            RecurrenceTemplateRepository.getRecurrenceTemplateInTransaction(
                                    recurrenceTemplateId, transaction);
                    if (maybeRecurrenceTemplate.isEmpty()) {
                        logger.warn("Recurrence template not found for id: {} during transaction. Skipping processing of this recurring event to avoid TOCTOU failures.",
                                recurrenceTemplateId);
                        return new RecurrenceTransactionResult(null, false);
                    }

                    RecurrenceTemplate recurrenceTemplate = maybeRecurrenceTemplate.get();
                    RecurrenceData recurrenceData = recurrenceTemplate.getRecurrenceData();
                    Map<String, String> pastRecurrences = recurrenceData.getPastRecurrences() == null
                            ? new HashMap<>()
                            : new HashMap<>(recurrenceData.getPastRecurrences());
                    NewEventData templateEvent = recurrenceTemplate.getEventData();
                    Timestamp recurrenceTimestamp = findNextRecurrenceToCreate(
                            recurrenceData, pastRecurrences, today, createEventWorkflow, templateEvent);
                    if (recurrenceTimestamp == null) {
                        return new RecurrenceTransactionResult(null,
                                shouldMoveTemplateToInactiveAfterNoCreation(
                                        recurrenceData, today, createEventWorkflow, templateEvent));
                    }

                    String recurrenceTimestampString = TimeUtils.getTimestampStringFromTimezone(
                            recurrenceTimestamp, SYDNEY_TIMEZONE);
                    NewEventData newEventDataDeepCopy = createEventDataForRecurrence(
                            recurrenceTemplate.getEventData(), recurrenceTimestamp);
                    String newEventId = eventIdsByRecurrence.computeIfAbsent(
                            recurrenceTimestampString, ignored -> EventIdGenerator.newEventId());

                    List<DocumentSnapshot> eventLinkDocuments =
                            CustomEventLinksService.getEventLinkDocumentsPointedToRecurrence(
                                    newEventDataDeepCopy.getOrganiserId(), recurrenceTemplateId, transaction);
                    List<DocumentReference> eventCollectionDocuments =
                            EventCollectionsService.getEventCollectionDocumentsContainingRecurringTemplate(
                                    recurrenceTemplateId, transaction);

                    CreateEventHandler.createEvent(newEventDataDeepCopy, transaction, newEventId);
                    CustomEventLinksService.updateEventLinks(eventLinkDocuments, newEventId, transaction);
                    EventCollectionsService.addEventToEventCollections(
                            eventCollectionDocuments, newEventId, transaction);
                    pastRecurrences.put(recurrenceTimestampString, newEventId);

                    RecurrenceData newRecurrenceData = recurrenceData.toBuilder()
                            .pastRecurrences(pastRecurrences).build();
                    RecurrenceTemplateRepository.updateRecurrenceTemplate(recurrenceTemplateId,
                            recurrenceTemplate.toBuilder().recurrenceData(newRecurrenceData).build(), transaction);

                    List<ReservedSlot> reservedSlots = recurrenceData.getReservedSlots();
                    return new RecurrenceTransactionResult(new CreatedRecurringEvent(newEventId,
                            reservedSlots == null ? List.of() : new ArrayList<>(reservedSlots)),
                            finalCreationDateHasPassed(recurrenceData, today, templateEvent)
                                    && findNextRecurrenceToCreate(recurrenceData, pastRecurrences,
                                            today, false, templateEvent) == null);
            });

            if (transactionResult.createdEvent() == null) {
                return new RecurrenceTemplateProcessingResult(createdEvents,
                        transactionResult.moveToInactive());
            }

            createdEvents.add(transactionResult.createdEvent());
            if (transactionResult.moveToInactive() || createEventWorkflow) {
                return new RecurrenceTemplateProcessingResult(createdEvents,
                        transactionResult.moveToInactive());
            }
        } while (!createEventWorkflow);

        return new RecurrenceTemplateProcessingResult(createdEvents, false);
    }

    private static void processReservedSlots(List<CreatedRecurringEvent> createdEvents) {
        for (CreatedRecurringEvent createdEvent : createdEvents) {
            if (createdEvent.reservedSlots().isEmpty()) {
                continue;
            }
            try {
                FirebaseService.createFirestoreTransaction(transaction -> {
                    ReservedSlotService.processReservedSlots(createdEvent.eventId(),
                            createdEvent.reservedSlots(), transaction);
                    return null;
                });
            } catch (Exception e) {
                logger.error("Failed to process reserved slots for event {}: {}",
                        createdEvent.eventId(), e.getMessage(), e);
            }
        }
    }

    private static void moveRecurringEventToInactive(String recurrenceId, Transaction transaction) throws Exception {
        // Get the Recurrence Template from firestore with transaction first
        Optional<RecurrenceTemplate> maybeRecurrenceTemplate =
                RecurrenceTemplateRepository.getRecurrenceTemplateInTransaction(recurrenceId, transaction);
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

    static Timestamp findNextRecurrenceToCreate(RecurrenceData recurrenceData,
            Map<String, String> pastRecurrences, LocalDate today, boolean createEventWorkflow) {
        return findNextRecurrenceToCreate(recurrenceData, pastRecurrences, today, createEventWorkflow, null);
    }

    /**
     * Picks the next occurrence that is not already created. Already-created
     * ordinals keep the timestamp stored for them, and slots that have not been
     * created use the venue wall clock. New pastRecurrences keys stay in the
     * Sydney {@code yyyy-MM-dd HH:mm:ss O} format.
     */
    static Timestamp findNextRecurrenceToCreate(RecurrenceData recurrenceData,
            Map<String, String> pastRecurrences, LocalDate today, boolean createEventWorkflow,
            NewEventData eventData) {
        if (!Boolean.TRUE.equals(recurrenceData.getRecurrenceEnabled())) {
            return null;
        }

        ZoneId zone = eventData == null ? SYDNEY_TIMEZONE : EventTimeZone.resolve(eventData);
        LocalDate venueToday = venueDateAtSydneyMidnight(today, zone);
        int createDaysBefore = recurrenceData.getCreateDaysBefore() == null
                ? 0
                : recurrenceData.getCreateDaysBefore();
        for (Timestamp recurrenceTimestamp : occurrencesToSchedule(recurrenceData, eventData, pastRecurrences)) {
            if (occurrenceAlreadyCreated(recurrenceTimestamp, pastRecurrences, zone)) {
                continue;
            }
            LocalDate eventCreationDate = recurrenceTimestamp.toSqlTimestamp().toInstant()
                    .atZone(zone).toLocalDate()
                    .minusDays(createDaysBefore);
            if (createEventWorkflow || venueToday.equals(eventCreationDate)) {
                return recurrenceTimestamp;
            }
        }
        return null;
    }

    static List<Timestamp> occurrencesToSchedule(RecurrenceData recurrenceData, NewEventData eventData) {
        return occurrencesToSchedule(recurrenceData, eventData, recurrenceData.getPastRecurrences());
    }

    /**
     * Honours timestamps already stored for created ordinals. Uncreated slots are
     * recalculated on the venue wall clock so a UTC-stepped date is not reused.
     */
    static List<Timestamp> occurrencesToSchedule(RecurrenceData recurrenceData, NewEventData eventData,
            Map<String, String> pastRecurrences) {
        List<Timestamp> stored = recurrenceData.getAllRecurrences();
        if (stored == null) {
            stored = List.of();
        }
        if (eventData == null || eventData.getStartDate() == null
                || recurrenceData.getFrequency() == null
                || recurrenceData.getRecurrenceAmount() == null) {
            return stored;
        }
        return RecurringEventsService.scheduleRespectingCreatedOccurrences(
                eventData.getStartDate(),
                recurrenceData.getFrequency(),
                recurrenceData.getRecurrenceAmount(),
                true,
                EventTimeZone.resolve(eventData),
                stored,
                eventData.getStartDate(),
                pastRecurrences);
    }

    /**
     * True when this venue-local calendar day already has an event. Exact Sydney
     * keys still match, and so does the key written for the pre-fix UTC-stepped instant.
     */
    static boolean occurrenceAlreadyCreated(Timestamp occurrence, Map<String, String> pastRecurrences, ZoneId zone) {
        if (pastRecurrences == null || pastRecurrences.isEmpty() || occurrence == null) {
            return false;
        }
        String exactKey = TimeUtils.getTimestampStringFromTimezone(occurrence, SYDNEY_TIMEZONE);
        if (pastRecurrences.containsKey(exactKey)) {
            return true;
        }
        ZoneId eventZone = zone == null ? SYDNEY_TIMEZONE : zone;
        LocalDate venueDay = occurrence.toSqlTimestamp().toInstant().atZone(eventZone).toLocalDate();
        DateTimeFormatter parser = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss O");
        for (String pastKey : pastRecurrences.keySet()) {
            if (pastKey == null || pastKey.isBlank()) {
                continue;
            }
            try {
                ZonedDateTime parsed = ZonedDateTime.parse(pastKey, parser);
                if (parsed.toInstant().atZone(eventZone).toLocalDate().equals(venueDay)) {
                    return true;
                }
            } catch (DateTimeException ignored) {
                // Keys this formatter cannot read still match through the exact string above.
            }
        }
        return false;
    }

    static LocalDate venueDateAtSydneyMidnight(LocalDate sydneyToday, ZoneId zone) {
        ZoneId eventZone = zone == null ? SYDNEY_TIMEZONE : zone;
        return sydneyToday.atStartOfDay(SYDNEY_TIMEZONE).withZoneSameInstant(eventZone).toLocalDate();
    }

    static NewEventData createEventDataForRecurrence(NewEventData eventData,
            Timestamp recurrenceTimestamp) {
        NewEventData eventDataCopy = JavaUtils.deepCopy(eventData, NewEventData.class);
        ZoneId zone = EventTimeZone.stamp(eventDataCopy);
        Timestamp templateStart = eventData.getStartDate();
        if (templateStart != null && eventData.getEndDate() != null) {
            eventDataCopy.setEndDate(EventTimeZone.applyLocalRelationship(
                    templateStart, eventData.getEndDate(), recurrenceTimestamp, zone));
        }
        if (templateStart != null && eventData.getRegistrationDeadline() != null) {
            eventDataCopy.setRegistrationDeadline(EventTimeZone.applyLocalRelationship(
                    templateStart, eventData.getRegistrationDeadline(), recurrenceTimestamp, zone));
        }
        eventDataCopy.setStartDate(recurrenceTimestamp);
        return eventDataCopy;
    }

    private static boolean finalCreationDateHasPassed(RecurrenceData recurrenceData,
            LocalDate today, NewEventData eventData) {
        List<Timestamp> occurrences = occurrencesToSchedule(recurrenceData, eventData);
        Timestamp latestTimestamp = occurrences.stream()
                .max(Timestamp::compareTo)
                .orElseThrow();
        ZoneId zone = eventData == null ? SYDNEY_TIMEZONE : EventTimeZone.resolve(eventData);
        int createDaysBefore = recurrenceData.getCreateDaysBefore() == null
                ? 0
                : recurrenceData.getCreateDaysBefore();
        LocalDate finalEventCreationDate = latestTimestamp.toSqlTimestamp().toInstant()
                .atZone(zone).toLocalDate()
                .minusDays(createDaysBefore);
        return !venueDateAtSydneyMidnight(today, zone).isBefore(finalEventCreationDate);
    }

    static boolean shouldMoveTemplateToInactiveAfterNoCreation(RecurrenceData recurrenceData,
            LocalDate today, boolean createEventWorkflow) {
        return shouldMoveTemplateToInactiveAfterNoCreation(recurrenceData, today, createEventWorkflow, null);
    }

    static boolean shouldMoveTemplateToInactiveAfterNoCreation(RecurrenceData recurrenceData,
            LocalDate today, boolean createEventWorkflow, NewEventData eventData) {
        List<Timestamp> occurrences = occurrencesToSchedule(recurrenceData, eventData);
        return (createEventWorkflow && Boolean.TRUE.equals(recurrenceData.getRecurrenceEnabled()))
                || occurrences.isEmpty()
                || finalCreationDateHasPassed(recurrenceData, today, eventData);
    }

    private record CreatedRecurringEvent(String eventId, List<ReservedSlot> reservedSlots) {
    }

    private record RecurrenceTransactionResult(CreatedRecurringEvent createdEvent,
                                               boolean moveToInactive) {
    }

    private record RecurrenceTemplateProcessingResult(List<CreatedRecurringEvent> createdEvents,
                                                       boolean moveToInactive) {
    }


}
