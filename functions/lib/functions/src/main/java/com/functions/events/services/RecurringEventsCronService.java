package com.functions.events.services;


import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.NewEventData;
import com.functions.events.models.RecurrenceData;
import com.functions.events.models.RecurrenceTemplate;
import com.functions.events.models.ReservedSlot;
import com.functions.events.repositories.RecurrenceTemplateRepository;
import com.functions.firebase.services.FirebaseService;
import com.functions.utils.TimeUtils;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.Transaction;

public class RecurringEventsCronService {
    private static final Logger logger = LoggerFactory.getLogger(RecurringEventsCronService.class);
    private static final ZoneId SYDNEY_TIMEZONE = ZoneId.of("Australia/Sydney");

    public static List<String> createEventsFromRecurrenceTemplates(LocalDate today) throws Exception {
        return createEventsFromRecurrenceTemplates(today, null, null);
    }

    public static List<String> ensureRecurrenceOccurrence(String recurrenceTemplateId,
            Timestamp recurrenceTimestamp) throws Exception {
        return createEventsFromRecurrenceTemplates(LocalDate.now(SYDNEY_TIMEZONE),
                recurrenceTemplateId, recurrenceTimestamp);
    }

    private static List<String> createEventsFromRecurrenceTemplates(LocalDate today,
            String targetRecurrenceTemplateId, Timestamp targetRecurrenceTimestamp)
            throws Exception {
        logger.info("Creating events from recurrence templates. today: {}, recurrenceTemplateId: {}, targetRecurrenceTimestamp: {}", today, targetRecurrenceTemplateId, targetRecurrenceTimestamp);
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
                    recurrenceTemplateId, today, targetRecurrenceTimestamp);
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
            String recurrenceTemplateId, LocalDate today, Timestamp targetRecurrenceTimestamp)
            throws Exception {
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
                    Timestamp recurrenceTimestamp = findNextRecurrenceToCreate(
                            recurrenceData, pastRecurrences, today,
                            targetRecurrenceTimestamp);
                    if (recurrenceTimestamp == null) {
                        return new RecurrenceTransactionResult(null,
                                shouldMoveTemplateToInactiveAfterNoCreation(
                                        recurrenceData, today));
                    }

                    Optional<RecurringEventOccurrenceService.OccurrenceCreationResult>
                            maybeCreatedOccurrence =
                            RecurringEventOccurrenceService.createOccurrenceIfMissing(
                                    recurrenceTemplateId, recurrenceTemplate, recurrenceTimestamp,
                                    transaction, eventIdsByRecurrence);
                    if (maybeCreatedOccurrence.isEmpty()) {
                        return new RecurrenceTransactionResult(null,
                                shouldMoveTemplateToInactiveAfterNoCreation(recurrenceData, today));
                    }

                    RecurringEventOccurrenceService.OccurrenceCreationResult createdOccurrence =
                            maybeCreatedOccurrence.get();
                    RecurrenceData updatedRecurrenceData = createdOccurrence.updatedTemplate()
                            .getRecurrenceData();
                    return new RecurrenceTransactionResult(new CreatedRecurringEvent(
                            createdOccurrence.eventId(), createdOccurrence.reservedSlots()),
                            finalCreationDateHasPassed(updatedRecurrenceData, today)
                                    && findNextRecurrenceToCreate(updatedRecurrenceData,
                                            updatedRecurrenceData.getPastRecurrences(),
                                            today, null) == null);
            });

            if (transactionResult.createdEvent() == null) {
                return new RecurrenceTemplateProcessingResult(createdEvents,
                        transactionResult.moveToInactive());
            }

            createdEvents.add(transactionResult.createdEvent());
            if (transactionResult.moveToInactive() || targetRecurrenceTimestamp != null) {
                return new RecurrenceTemplateProcessingResult(createdEvents,
                        transactionResult.moveToInactive());
            }
        } while (targetRecurrenceTimestamp == null);

        return new RecurrenceTemplateProcessingResult(createdEvents, false);
    }

    private static void processReservedSlots(List<CreatedRecurringEvent> createdEvents) {
        for (CreatedRecurringEvent createdEvent : createdEvents) {
            processReservedSlots(createdEvent.eventId(), createdEvent.reservedSlots());
        }
    }

    static void processReservedSlots(String eventId, List<ReservedSlot> reservedSlots) {
        if (reservedSlots.isEmpty()) {
            return;
        }
        try {
            FirebaseService.createFirestoreTransaction(transaction -> {
                ReservedSlotService.processReservedSlots(eventId, reservedSlots, transaction);
                return null;
            });
        } catch (Exception e) {
            logger.error("Failed to process reserved slots for event {}: {}", eventId,
                    e.getMessage(), e);
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
            Map<String, String> pastRecurrences, LocalDate today,
            Timestamp targetRecurrenceTimestamp) {
        if (!recurrenceData.getRecurrenceEnabled()) {
            return null;
        }

        for (Timestamp recurrenceTimestamp : recurrenceData.getAllRecurrences()) {
            String recurrenceTimestampString = TimeUtils.getTimestampStringFromTimezone(
                    recurrenceTimestamp, SYDNEY_TIMEZONE);
            if (targetRecurrenceTimestamp != null
                    && !recurrenceTimestampString.equals(TimeUtils.getTimestampStringFromTimezone(
                            targetRecurrenceTimestamp, SYDNEY_TIMEZONE))) {
                continue;
            }
            LocalDate eventCreationDate = recurrenceTimestamp.toSqlTimestamp().toInstant()
                    .atZone(SYDNEY_TIMEZONE).toLocalDate()
                    .minusDays(recurrenceData.getCreateDaysBefore());
            if (!pastRecurrences.containsKey(recurrenceTimestampString)
                    && (targetRecurrenceTimestamp != null || today.equals(eventCreationDate))) {
                return recurrenceTimestamp;
            }
        }
        return null;
    }

    private static boolean finalCreationDateHasPassed(RecurrenceData recurrenceData,
            LocalDate today) {
        Timestamp latestTimestamp = recurrenceData.getAllRecurrences().stream()
                .max(Timestamp::compareTo)
                .orElseThrow();
        LocalDate finalEventCreationDate = latestTimestamp.toSqlTimestamp().toInstant()
                .atZone(SYDNEY_TIMEZONE).toLocalDate()
                .minusDays(recurrenceData.getCreateDaysBefore());
        return !today.isBefore(finalEventCreationDate);
    }

    static boolean shouldMoveTemplateToInactiveAfterNoCreation(RecurrenceData recurrenceData,
            LocalDate today) {
        return recurrenceData.getAllRecurrences().isEmpty()
                || finalCreationDateHasPassed(recurrenceData, today);
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
