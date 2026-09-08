package com.functions.events.services;

import com.functions.events.models.NewEventData;
import com.functions.events.models.NewRecurrenceData;
import com.functions.events.models.RecurrenceData;
import com.functions.events.models.RecurrenceTemplate;
import com.functions.events.repositories.RecurrenceTemplateRepository;
import com.functions.firebase.services.FirebaseService;
import com.functions.users.models.PrivateUserData;
import com.functions.users.services.Users;
import com.functions.utils.TimeUtils;
import com.google.cloud.Timestamp;
import com.google.common.annotations.VisibleForTesting;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

public class RecurringEventsService {
    private static final Logger logger = LoggerFactory.getLogger(RecurringEventsService.class);

    // Returns Map.Entry<RecurrenceTemplateId, EventId>
    public static Optional<Map.Entry<String, String>> createRecurrenceTemplate(NewEventData newEventData, NewRecurrenceData newRecurrenceData) {
        // Calculate all future recurrence Dates
        RecurrenceData recurrenceData = calculateRecurrenceData(newRecurrenceData,
                newEventData.getStartDate(), Map.of());
        RecurrenceTemplate recurrenceTemplate = RecurrenceTemplate.builder()
                .eventData(newEventData)
                .recurrenceData(recurrenceData)
                .build();

        // Place content in the firestore database
        try {
            String recurrenceTemplateId = RecurrenceTemplateRepository.createRecurrenceTemplate(newEventData.getIsActive(), newEventData.getIsPrivate(), recurrenceTemplate);
            // Update User Data to add recurrence Template
            PrivateUserData privateUserData = Users.getPrivateUserDataById(newEventData.getOrganiserId());
            List<String> recurrenceTemplates = privateUserData.getRecurrenceTemplates();
            recurrenceTemplates.add(recurrenceTemplateId);
            privateUserData.setRecurrenceTemplates(recurrenceTemplates);
            Users.updatePrivateUserData(newEventData.getOrganiserId(), privateUserData);
            // Create the first event iteration
            String eventId = RecurringEventsCronService.ensureRecurrenceOccurrence(
                    recurrenceTemplateId, newEventData.getStartDate()).stream().findFirst()
                    .orElseThrow(() -> new Exception(
                            "Failed to create initial event for recurrence template: "
                                    + recurrenceTemplateId));
            logger.info("Successfully created new Recurrence Template {}", recurrenceTemplateId);
            return Optional.of(Map.entry(recurrenceTemplateId, eventId));
        } catch (Exception e) {
            logger.error("Error when creating new Recurrence Template", e);
            return Optional.empty();
        }
    }

    public static Optional<String> updateRecurrenceTemplate(String recurrenceTemplateId, NewEventData newEventData, NewRecurrenceData newRecurrenceData) {
        try {
            Map<String, String> eventIdsByRecurrence = new HashMap<>();
            Optional<RecurrenceTemplateUpdateResult> maybeUpdateResult =
                    FirebaseService.createFirestoreTransaction(transaction -> {
                        Optional<RecurrenceTemplate> maybeCurrentRecurrenceTemplate =
                                RecurrenceTemplateRepository.getRecurrenceTemplateInTransaction(
                                        recurrenceTemplateId, transaction);
                        if (maybeCurrentRecurrenceTemplate.isEmpty()) {
                            return Optional.empty();
                        }

                        RecurrenceTemplate currentRecurrenceTemplate =
                                maybeCurrentRecurrenceTemplate.get();
                        NewEventData updatedEventData = newEventData == null
                                ? currentRecurrenceTemplate.getEventData()
                                : newEventData;
                        NewRecurrenceData updatedRecurrenceData = newRecurrenceData == null
                                ? currentRecurrenceTemplate.getRecurrenceData()
                                        .extractNewRecurrenceData()
                                : newRecurrenceData;
                        RecurrenceData recurrenceData = calculateRecurrenceData(
                                updatedRecurrenceData, updatedEventData.getStartDate(),
                                copyPastRecurrences(currentRecurrenceTemplate.getRecurrenceData()
                                        .getPastRecurrences()));
                        RecurrenceTemplate recurrenceTemplate = RecurrenceTemplate.builder()
                                .eventData(updatedEventData)
                                .recurrenceData(recurrenceData)
                                .build();
                        Optional<RecurringEventOccurrenceService.OccurrenceCreationResult>
                                maybeCreatedOccurrence =
                                RecurringEventOccurrenceService.createOccurrenceIfMissing(
                                        recurrenceTemplateId, recurrenceTemplate,
                                        updatedEventData.getStartDate(), transaction,
                                        eventIdsByRecurrence);
                        if (maybeCreatedOccurrence.isPresent()) {
                            RecurringEventOccurrenceService.OccurrenceCreationResult
                                    createdOccurrence = maybeCreatedOccurrence.get();
                            return Optional.of(new RecurrenceTemplateUpdateResult(
                                    createdOccurrence.updatedTemplate(),
                                    createdOccurrence));
                        }

                        RecurrenceTemplateRepository.updateRecurrenceTemplate(recurrenceTemplateId,
                                recurrenceTemplate, transaction);
                        return Optional.of(new RecurrenceTemplateUpdateResult(recurrenceTemplate,
                                null));
                    });

            if (maybeUpdateResult.isEmpty()) {
                logger.warn("Updating recurrence template that does not exist {}", recurrenceTemplateId);
                return Optional.empty();
            }

            RecurrenceTemplateUpdateResult updateResult = maybeUpdateResult.get();
            RecurrenceTemplate recurrenceTemplate = updateResult.recurrenceTemplate();
            logger.info("Successfully updated Recurrence Template {} {}", recurrenceTemplateId, recurrenceTemplate);

            // Check is recurrence is being reactivated
            boolean isRecurrenceActive = recurrenceTemplate.getEventData().getIsActive();
            if (!isRecurrenceActive) {
                List<Timestamp> allRecurrences = recurrenceTemplate.getRecurrenceData().getAllRecurrences();
                if (!allRecurrences.isEmpty()) {
                    Timestamp lastRecurrence = allRecurrences.get(allRecurrences.size() - 1);
                    // If the lastRecurrence is in the future, we have re-enabled the Recurring Events
                    if (lastRecurrence.getSeconds() > Timestamp.now().getSeconds()) {
                        RecurrenceTemplateRepository.moveRecurrenceTemplateToActive(recurrenceTemplateId, recurrenceTemplate);
                        logger.info("Successfully moved Recurrence Template {} to active", recurrenceTemplateId);
                    }
                }
            }

            if (updateResult.createdOccurrence() != null) {
                RecurringEventsCronService.processReservedSlots(
                        updateResult.createdOccurrence().eventId(),
                        updateResult.createdOccurrence().reservedSlots());
            }

            return Optional.of(recurrenceTemplateId);
        } catch (Exception e) {
            logger.error("Error when updating Recurrence Template {}", recurrenceTemplateId, e);
            return Optional.empty();
        }
    }

    private static RecurrenceData calculateRecurrenceData(NewRecurrenceData newRecurrenceData,
            Timestamp startDate, Map<String, String> pastRecurrences) {
        List<Timestamp> allRecurrences = calculateAllRecurrenceDates(startDate,
                newRecurrenceData.getFrequency(), newRecurrenceData.getRecurrenceAmount());
        return RecurrenceData.builderFromNewRecurrenceData(newRecurrenceData)
                .allRecurrences(allRecurrences)
                .pastRecurrences(pastRecurrences)
                .build();
    }

    private static Map<String, String> copyPastRecurrences(Map<String, String> pastRecurrences) {
        return pastRecurrences == null ? new HashMap<>() : new HashMap<>(pastRecurrences);
    }

    private record RecurrenceTemplateUpdateResult(RecurrenceTemplate recurrenceTemplate,
            RecurringEventOccurrenceService.OccurrenceCreationResult createdOccurrence) {
    }

    @VisibleForTesting
    public static List<Timestamp> calculateAllRecurrenceDates(Timestamp startDate,
            RecurrenceData.Frequency frequency, Integer recurrenceAmount) {
        logger.info("Calculating all recurrence dates from {} with a frequency of {} for {} times", startDate, frequency, recurrenceAmount);
        switch (frequency) {
            case WEEKLY:
            case FORTNIGHTLY:
                // We want to do recurrenceAmount + 1 as we count the initial date as a recurrence, but not in the UI
                return IntStream.range(0, recurrenceAmount + 1).mapToObj(recurrenceNumber -> {
                    logger.info("recurrenceNumber {}", recurrenceNumber);
                    LocalDateTime recurrenceDateTime = TimeUtils.convertTimestampToLocalDateTime(startDate)
                            .plusDays((long) recurrenceNumber * frequency.getValue());
                    return TimeUtils.convertLocalDateTimeToTimestamp(recurrenceDateTime);
                }).collect(Collectors.toList());
            case MONTHLY:
                // We want to do recurrenceAmount + 1 as we count the initial date as a recurrence, but not in the UI
                return IntStream.range(0, recurrenceAmount + 1).mapToObj(recurrenceNumber -> {
                    LocalDateTime recurrenceDateTime = TimeUtils.convertTimestampToLocalDateTime(startDate)
                            .plusMonths(recurrenceNumber);
                    return TimeUtils.convertLocalDateTimeToTimestamp(recurrenceDateTime);
                }).collect(Collectors.toList());
            default:
                return List.of();
        }
    }
}
