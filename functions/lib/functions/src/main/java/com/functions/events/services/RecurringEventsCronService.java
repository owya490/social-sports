package com.functions.events.services;


import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.handlers.CreateEventHandler;
import com.functions.events.models.NewEventData;
import com.functions.events.models.RecurrenceData;
import com.functions.events.models.RecurrenceTemplate;
import com.functions.events.models.ReservedSlot;
import com.functions.events.repositories.RecurrenceTemplateRepository;
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
                    Timestamp recurrenceTimestamp = findNextRecurrenceToCreate(
                            recurrenceData, pastRecurrences, today, createEventWorkflow);
                    if (recurrenceTimestamp == null) {
                        return new RecurrenceTransactionResult(null,
                                shouldMoveTemplateToInactiveAfterNoCreation(
                                        recurrenceData, today, createEventWorkflow));
                    }

                    String recurrenceTimestampString = TimeUtils.getTimestampStringFromTimezone(
                            recurrenceTimestamp, SYDNEY_TIMEZONE);
                    NewEventData newEventDataDeepCopy = createEventDataForRecurrence(
                            recurrenceTemplate.getEventData(), recurrenceTimestamp);
                    String newEventId = eventIdsByRecurrence.computeIfAbsent(
                            recurrenceTimestampString, ignored -> UUID.randomUUID().toString());

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
                            finalCreationDateHasPassed(recurrenceData, today)
                                    && findNextRecurrenceToCreate(recurrenceData, pastRecurrences,
                                            today, false) == null);
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
        if (!recurrenceData.getRecurrenceEnabled()) {
            return null;
        }

        for (Timestamp recurrenceTimestamp : recurrenceData.getAllRecurrences()) {
            String recurrenceTimestampString = TimeUtils.getTimestampStringFromTimezone(
                    recurrenceTimestamp, SYDNEY_TIMEZONE);
            LocalDate eventCreationDate = recurrenceTimestamp.toSqlTimestamp().toInstant()
                    .atZone(SYDNEY_TIMEZONE).toLocalDate()
                    .minusDays(recurrenceData.getCreateDaysBefore());
            if (!pastRecurrences.containsKey(recurrenceTimestampString)
                    && (createEventWorkflow || today.equals(eventCreationDate))) {
                return recurrenceTimestamp;
            }
        }
        return null;
    }

    private static NewEventData createEventDataForRecurrence(NewEventData eventData,
            Timestamp recurrenceTimestamp) {
        NewEventData eventDataCopy = JavaUtils.deepCopy(eventData, NewEventData.class);
        long eventLengthMillis = eventDataCopy.getEndDate().toSqlTimestamp().getTime()
                - eventDataCopy.getStartDate().toSqlTimestamp().getTime();
        long eventDeadlineDeltaMillis = eventDataCopy.getRegistrationDeadline().toSqlTimestamp().getTime()
                - eventDataCopy.getStartDate().toSqlTimestamp().getTime();
        eventDataCopy.setStartDate(recurrenceTimestamp);
        eventDataCopy.setEndDate(Timestamp.ofTimeMicroseconds(
                (recurrenceTimestamp.toSqlTimestamp().getTime() + eventLengthMillis) * 1000));
        eventDataCopy.setRegistrationDeadline(Timestamp.ofTimeMicroseconds(
                (recurrenceTimestamp.toSqlTimestamp().getTime() + eventDeadlineDeltaMillis) * 1000));
        return eventDataCopy;
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
            LocalDate today, boolean createEventWorkflow) {
        return (createEventWorkflow && Boolean.TRUE.equals(recurrenceData.getRecurrenceEnabled()))
                || recurrenceData.getAllRecurrences().isEmpty()
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
