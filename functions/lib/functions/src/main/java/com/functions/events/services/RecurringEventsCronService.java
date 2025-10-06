package com.functions.events.services;


import com.functions.events.handlers.CreateEventHandler;
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class RecurringEventsCronService {
    private static final Logger logger = LoggerFactory.getLogger(RecurringEventsCronService.class);

    public static List<String> createEventsFromRecurrenceTemplates(LocalDate today) throws Exception {
        return createEventsFromRecurrenceTemplates(today, null, null, false);
    }

    public static List<String> createEventsFromRecurrenceTemplates(LocalDate today, String targetRecurrenceTemplateId, RecurrenceTemplate targetRecurrenceTemplate, boolean createEventWorkflow) throws Exception {
        logger.info("Creating events from recurrence templates. today: {}, targetRecurrenceTemplateId: {}, targetRecurrenceTemplate: {}, createEventWorkflow: {}", today, targetRecurrenceTemplateId, targetRecurrenceTemplate, createEventWorkflow);
        
        // Get active recurrence templates
        Map<String, RecurrenceTemplate> activeRecurrenceTemplates;
        if (targetRecurrenceTemplateId == null) {
            activeRecurrenceTemplates = RecurrenceTemplateRepository.getAllActiveRecurrenceTemplates();
        } else {
            activeRecurrenceTemplates = Map.of(targetRecurrenceTemplateId, targetRecurrenceTemplate);
        }

        logger.info("All Active Recurrence Templates {}", activeRecurrenceTemplates);
        List<String> moveToInactiveRecurringEvents = new ArrayList<>();
        List<String> allCreatedEventIds = new ArrayList<>();

        // Process each recurrence template in its own transaction
        for (Map.Entry<String, RecurrenceTemplate> entry : activeRecurrenceTemplates.entrySet()) {
            String recurrenceTemplateId = entry.getKey();
            RecurrenceTemplate recurrenceTemplate = entry.getValue();

            try {
                List<String> createdEventIds = RecurrenceTemplateRepository.createFirestoreTransaction(transaction -> {
                    try {
                        return processRecurrenceTemplateInTransaction(today, recurrenceTemplateId, recurrenceTemplate, createEventWorkflow, transaction);
                    } catch (Exception e) {
                        logger.error("Error processing recurrence template {} in transaction: {}", recurrenceTemplateId, e.getMessage());
                        throw new RuntimeException(e);
                    }
                });
                
                if (createdEventIds != null) {
                    allCreatedEventIds.addAll(createdEventIds);
                }
                
                // Check if template should be moved to inactive
                if (shouldMoveToInactive(recurrenceTemplate, today)) {
                    moveToInactiveRecurringEvents.add(recurrenceTemplateId);
                }
                
            } catch (Exception e) {
                logger.error("Failed to process recurrence template {}: {}. Continuing with other templates.", recurrenceTemplateId, e.getMessage());
            }
        }

        // Move templates to inactive in separate transactions
        for (String recurringEventId : moveToInactiveRecurringEvents) {
            try {
                RecurrenceTemplateRepository.createFirestoreTransaction(transaction -> {
                    try {
                        moveRecurringEventToInactive(recurringEventId, transaction);
                        return null;
                    } catch (Exception e) {
                        logger.error("Error moving recurrence template {} to inactive: {}", recurringEventId, e.getMessage());
                        throw new RuntimeException(e);
                    }
                });
            } catch (Exception e) {
                logger.error("Failed to move recurrence template {} to inactive: {}", recurringEventId, e.getMessage());
            }
        }

        return allCreatedEventIds;
    }

    private static boolean shouldMoveToInactive(RecurrenceTemplate recurrenceTemplate, LocalDate today) {
        RecurrenceData recurrenceData = recurrenceTemplate.getRecurrenceData();
        if (recurrenceData.getAllRecurrences().isEmpty()) {
            return true;
        }
        
        Timestamp latestTimestamp = Collections.max(recurrenceData.getAllRecurrences(), Timestamp::compareTo);
        LocalDate finalEventCreationDate = TimeUtils.convertTimestampToLocalDateTime(latestTimestamp).toLocalDate()
                .minusDays(recurrenceData.getCreateDaysBefore());
        return !today.isBefore(finalEventCreationDate);
    }

    private static List<String> processRecurrenceTemplateInTransaction(LocalDate today, String recurrenceTemplateId, RecurrenceTemplate recurrenceTemplate, boolean createEventWorkflow, Transaction transaction) throws Exception {
        if (recurrenceTemplate == null) {
            throw new Exception(
                    "Could not turn recurringEventSnapshot object into RecurringEvent pojo using toObject: "
                            + recurrenceTemplateId);
        }
        
        NewEventData newEventData = recurrenceTemplate.getEventData();
        RecurrenceData recurrenceData = recurrenceTemplate.getRecurrenceData();
        Map<String, String> pastRecurrences = new HashMap<>(recurrenceData.getPastRecurrences());
        List<String> createdEventIds = new ArrayList<>();

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
                    CustomEventLinksService.updateEventLinksPointedToRecurrence(newEventDataDeepCopy.getOrganiserId(), recurrenceTemplateId, newEventId, transaction);
                } catch (Exception e) {
                    logger.error("Failed to update custom event links for recurrence template {}: {}", recurrenceTemplateId, e.getMessage());
                    // Continue with event creation even if custom links update fails
                }
            }
        }
        
        // Update the recurrence template with new past recurrences
        RecurrenceData newRecurrenceData = recurrenceData.toBuilder().pastRecurrences(pastRecurrences).build();
        logger.info("New Recurrence Data {}", newRecurrenceData.getPastRecurrences());
        RecurrenceTemplate newRecurrenceTemplate = recurrenceTemplate.toBuilder().recurrenceData(newRecurrenceData).build();

        RecurrenceTemplateRepository.updateRecurrenceTemplate(recurrenceTemplateId, newRecurrenceTemplate, transaction);

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
