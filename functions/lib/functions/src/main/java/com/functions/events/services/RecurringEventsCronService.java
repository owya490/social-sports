package com.functions.events.services;

import com.functions.events.models.NewEventData;
import com.functions.events.models.RecurrenceData;
import com.functions.events.models.RecurrenceTemplate;
import com.functions.events.repositories.RecurrenceTemplateRepository;
import com.functions.utils.JavaUtils;
import com.functions.utils.TimeUtils;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.Transaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

import static com.functions.events.services.EventsService.createEvent;

public class RecurringEventsCronService {
    private static final Logger logger = LoggerFactory.getLogger(RecurringEventsCronService.class);

    public static List<String> createEventsFromRecurrenceTemplates(LocalDate today) throws Exception {
        return createEventsFromRecurrenceTemplates(today, null, null, false);
    }

    public static List<String> createEventsFromRecurrenceTemplates(LocalDate today, String targetRecurrenceTemplateId, RecurrenceTemplate targetRecurrenceTemplate, boolean createEventWorkflow) throws Exception {
        Map<String, RecurrenceTemplate> activeRecurrenceTemplates;
        if (targetRecurrenceTemplateId == null) {
            activeRecurrenceTemplates = RecurrenceTemplateRepository.getAllActiveRecurrenceTemplates();
        } else {
            activeRecurrenceTemplates = Map.of(targetRecurrenceTemplateId, targetRecurrenceTemplate);
        }

        logger.info("All Active Recurrence Templates {}", activeRecurrenceTemplates);
        List<String> moveToInactiveRecurringEvents = new ArrayList<String>();

        List<String> createdEventIds = new ArrayList<String>();

        for (Map.Entry<String, RecurrenceTemplate> recurrenceTemplateAndId : activeRecurrenceTemplates.entrySet()) {
            String recurrenceTemplateId = recurrenceTemplateAndId.getKey();
            RecurrenceTemplate recurrenceTemplate = recurrenceTemplateAndId.getValue();

            // Create new transaction
            RecurrenceTemplateRepository.createFirestoreTransaction(transaction -> {
                if (recurrenceTemplate == null) {
                    throw new Exception(
                            "Could not turn recurringEventSnapshot object into RecurringEvent pojo using toObject: "
                                    + recurrenceTemplateId);
                }
                NewEventData newEventData = recurrenceTemplate.getEventData();
                RecurrenceData recurrenceData = recurrenceTemplate.getRecurrenceData();
                Map<String, String> pastRecurrences = new HashMap<>(recurrenceData.getPastRecurrences());

                boolean isStillActiveRecurrenceFlag = false;
                List<Timestamp> allRecurrences = recurrenceData.getAllRecurrences();

                if (createEventWorkflow) {
                    allRecurrences = List.of(allRecurrences.get(0));
                }

                for (Timestamp recurrenceTimestamp : allRecurrences) {
                    logger.info("Recurrence Timestamp: {}", recurrenceTimestamp);
                    String recurrenceTimestampString = TimeUtils.getTimestampStringFromTimezone(recurrenceTimestamp, ZoneId.of("Australia/Sydney"));
                    LocalDate eventCreationDate = TimeUtils.convertTimestampToLocalDateTime(recurrenceTimestamp).toLocalDate()
                            .minusDays(recurrenceData.getCreateDaysBefore());
                    if (!pastRecurrences.containsKey(recurrenceTimestampString) && (today.equals(eventCreationDate) || createEventWorkflow) && (recurrenceTemplate.getRecurrenceData().getRecurrenceEnabled())) {
                        NewEventData newEventDataDeepCopy = JavaUtils.deepCopy(newEventData, NewEventData.class);
                        long eventLengthMillis = newEventDataDeepCopy.getEndDate().toSqlTimestamp().getTime() - newEventDataDeepCopy.getStartDate().toSqlTimestamp().getTime();
                        long eventDeadlineDeltaMillis = newEventDataDeepCopy.getRegistrationDeadline().toSqlTimestamp().getTime() - newEventDataDeepCopy.getStartDate().toSqlTimestamp().getTime();
                        newEventDataDeepCopy.setStartDate(recurrenceTimestamp);
                        Timestamp newEndDate = Timestamp.ofTimeMicroseconds((recurrenceTimestamp.toSqlTimestamp().getTime() + eventLengthMillis) * 1000);
                        Timestamp newRegistrationDeadline = Timestamp.ofTimeMicroseconds((recurrenceTimestamp.toSqlTimestamp().getTime() + eventDeadlineDeltaMillis) * 1000);
                        newEventDataDeepCopy.setEndDate(newEndDate);
                        newEventDataDeepCopy.setRegistrationDeadline(newRegistrationDeadline);
                        String newEventId = createEvent(newEventDataDeepCopy, transaction);
                        logger.info("New event id: {}", newEventId);
                        createdEventIds.add(newEventId);
                        pastRecurrences.put(recurrenceTimestampString, newEventId);
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

        for (
                String recurringEventId : moveToInactiveRecurringEvents) {
            RecurrenceTemplateRepository.createFirestoreTransaction(transaction -> {
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
}
