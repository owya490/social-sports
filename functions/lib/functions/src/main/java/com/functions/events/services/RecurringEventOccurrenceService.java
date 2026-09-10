package com.functions.events.services;

import com.functions.events.handlers.CreateEventHandler;
import com.functions.events.models.NewEventData;
import com.functions.events.models.RecurrenceData;
import com.functions.events.models.RecurrenceTemplate;
import com.functions.events.models.ReservedSlot;
import com.functions.events.repositories.RecurrenceTemplateRepository;
import com.functions.utils.JavaUtils;
import com.functions.utils.TimeUtils;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Transaction;

import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

final class RecurringEventOccurrenceService {
    private static final ZoneId SYDNEY_TIMEZONE = ZoneId.of("Australia/Sydney");

    private RecurringEventOccurrenceService() {
    }

    static Optional<OccurrenceCreationResult> createOccurrenceIfMissing(
            String recurrenceTemplateId, RecurrenceTemplate recurrenceTemplate,
            Timestamp recurrenceTimestamp, Transaction transaction,
            Map<String, String> eventIdsByRecurrence) throws Exception {
        RecurrenceData recurrenceData = recurrenceTemplate.getRecurrenceData();
        if (!Boolean.TRUE.equals(recurrenceData.getRecurrenceEnabled())) {
            return Optional.empty();
        }

        Map<String, String> pastRecurrences = recurrenceData.getPastRecurrences() == null
                ? new HashMap<>()
                : new HashMap<>(recurrenceData.getPastRecurrences());
        String recurrenceTimestampString = TimeUtils.getTimestampStringFromTimezone(
                recurrenceTimestamp, SYDNEY_TIMEZONE);
        boolean isScheduledOccurrence = recurrenceData.getAllRecurrences().stream()
                .map(timestamp -> TimeUtils.getTimestampStringFromTimezone(timestamp,
                        SYDNEY_TIMEZONE))
                .anyMatch(recurrenceTimestampString::equals);
        if (!isScheduledOccurrence) {
            return Optional.empty();
        }
        if (pastRecurrences.containsKey(recurrenceTimestampString)) {
            return Optional.empty();
        }

        NewEventData eventData = createEventDataForRecurrence(
                recurrenceTemplate.getEventData(), recurrenceTimestamp);
        String eventId = eventIdsByRecurrence.computeIfAbsent(recurrenceTimestampString,
                ignored -> UUID.randomUUID().toString());
        List<DocumentSnapshot> eventLinkDocuments =
                CustomEventLinksService.getEventLinkDocumentsPointedToRecurrence(
                        eventData.getOrganiserId(), recurrenceTemplateId, transaction);
        List<DocumentReference> eventCollectionDocuments =
                EventCollectionsService.getEventCollectionDocumentsContainingRecurringTemplate(
                        recurrenceTemplateId, transaction);

        CreateEventHandler.createEvent(eventData, transaction, eventId);
        CustomEventLinksService.updateEventLinks(eventLinkDocuments, eventId, transaction);
        EventCollectionsService.addEventToEventCollections(eventCollectionDocuments, eventId,
                transaction);
        pastRecurrences.put(recurrenceTimestampString, eventId);

        RecurrenceTemplate updatedTemplate = recurrenceTemplate.toBuilder()
                .recurrenceData(recurrenceData.toBuilder().pastRecurrences(pastRecurrences).build())
                .build();
        RecurrenceTemplateRepository.updateRecurrenceTemplate(recurrenceTemplateId,
                updatedTemplate, transaction);

        List<ReservedSlot> reservedSlots = recurrenceData.getReservedSlots();
        return Optional.of(new OccurrenceCreationResult(eventId,
                reservedSlots == null ? List.of() : new ArrayList<>(reservedSlots),
                updatedTemplate));
    }

    private static NewEventData createEventDataForRecurrence(NewEventData eventData,
            Timestamp recurrenceTimestamp) {
        NewEventData eventDataCopy = JavaUtils.deepCopy(eventData, NewEventData.class);
        long eventLengthMillis = eventDataCopy.getEndDate().toSqlTimestamp().getTime()
                - eventDataCopy.getStartDate().toSqlTimestamp().getTime();
        long eventDeadlineDeltaMillis = eventDataCopy.getRegistrationDeadline().toSqlTimestamp()
                .getTime() - eventDataCopy.getStartDate().toSqlTimestamp().getTime();
        eventDataCopy.setStartDate(recurrenceTimestamp);
        eventDataCopy.setEndDate(Timestamp.ofTimeMicroseconds(
                (recurrenceTimestamp.toSqlTimestamp().getTime() + eventLengthMillis) * 1000));
        eventDataCopy.setRegistrationDeadline(Timestamp.ofTimeMicroseconds(
                (recurrenceTimestamp.toSqlTimestamp().getTime() + eventDeadlineDeltaMillis)
                        * 1000));
        return eventDataCopy;
    }

    record OccurrenceCreationResult(String eventId, List<ReservedSlot> reservedSlots,
                                    RecurrenceTemplate updatedTemplate) {
    }
}
