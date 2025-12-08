package com.functions.events.services;


import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
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
import com.functions.events.repositories.RecurrenceTemplateRepository;
import com.functions.firebase.services.FirebaseService;
import com.functions.utils.JavaUtils;
import com.functions.utils.TimeUtils;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.Transaction;

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
                    allRecurrences = List.of(allRecurrences.get(0));
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
                        String newEventId = CreateEventHandler.createEvent(newEventDataDeepCopy, transaction);
                        logger.info("New event id: {}", newEventId);
                        createdEventIds.add(newEventId);
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

        for (
                String recurringEventId : moveToInactiveRecurringEvents) {
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
}
