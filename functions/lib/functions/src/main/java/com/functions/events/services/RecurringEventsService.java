package com.functions.events.services;

import com.functions.events.models.NewEventData;
import com.functions.events.models.NewRecurrenceData;
import com.functions.events.models.RecurrenceData;
import com.functions.events.models.RecurrenceTemplate;
import com.functions.events.repositories.RecurrenceTemplateRepository;
import com.functions.utils.TimeUtils;
import com.google.cloud.Timestamp;
import com.google.common.annotations.VisibleForTesting;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

public class RecurringEventsService {
    private static final Logger logger = LoggerFactory.getLogger(RecurringEventsService.class);

    public static Optional<String> createRecurrenceTemplate(NewEventData newEventData, NewRecurrenceData newRecurrenceData) {
        // Calculate all future recurrence Dates
        RecurrenceData recurrenceData = calculateRecurrenceData(newRecurrenceData, newEventData.getStartDate());
        RecurrenceTemplate recurrenceTemplate = RecurrenceTemplate.builder()
                .eventData(newEventData)
                .recurrenceData(recurrenceData)
                .build();

        // Place content in the firestore database
        try {
            String recurrenceTemplateId = RecurrenceTemplateRepository.createRecurrenceTemplate(newEventData.getIsActive(), newEventData.getIsPrivate(), recurrenceTemplate);
            // TODO update users recurrence template list
            logger.info("Successfully created new Recurrence Template {}", recurrenceTemplateId);
            return Optional.of(recurrenceTemplateId);
        } catch (ExecutionException | InterruptedException e) {
            logger.error("Error when creating new Recurrence Template", e);
            return Optional.empty();
        }
    }

    public static Optional<String> updateRecurrenceTemplate(String recurrenceTemplateId, NewEventData newEventData, NewRecurrenceData newRecurrenceData) {
        // Get the current Recurrence Template
        Optional<RecurrenceTemplate> maybeCurrentRecurrenceTemplate = RecurrenceTemplateRepository.getRecurrenceTemplate(recurrenceTemplateId);

        if (maybeCurrentRecurrenceTemplate.isEmpty()) {
            logger.warn("Updating recurrence template that does not exist {}", recurrenceTemplateId);
            return Optional.empty();
        }
        RecurrenceTemplate currentRecurrenceTemplate = maybeCurrentRecurrenceTemplate.get();
        logger.info("Recurrence template found {} {}", recurrenceTemplateId, currentRecurrenceTemplate);
        Map<String, String> pastRecurrences = currentRecurrenceTemplate.getRecurrenceData().getPastRecurrences();

        if (newEventData == null) {
            newEventData = currentRecurrenceTemplate.getEventData();
        }
        if (newRecurrenceData == null) {
            newRecurrenceData = currentRecurrenceTemplate.getRecurrenceData().extractNewRecurrenceData();
        }

        // Calculate all future recurrence Dates
        RecurrenceData recurrenceData = calculateRecurrenceData(newRecurrenceData, newEventData.getStartDate(), pastRecurrences);
        RecurrenceTemplate recurrenceTemplate = RecurrenceTemplate.builder()
                .eventData(newEventData)
                .recurrenceData(recurrenceData)
                .build();

        // Place content in the firestore database
        try {
            String templateId = RecurrenceTemplateRepository.updateRecurrenceTemplate(recurrenceTemplateId, recurrenceTemplate);
            logger.info("Successfully updated Recurrence Template {}", recurrenceTemplateId);
            return Optional.of(templateId);
        } catch (ExecutionException | InterruptedException e) {
            logger.error("Error when updating Recurrence Template {}", recurrenceTemplateId, e);
            return Optional.empty();
        }
    }

    private static RecurrenceData calculateRecurrenceData(NewRecurrenceData newRecurrenceData, Timestamp startDate) {
        return calculateRecurrenceData(newRecurrenceData, startDate, Map.of());
    }

    private static RecurrenceData calculateRecurrenceData(NewRecurrenceData newRecurrenceData, Timestamp startDate, Map<String, String> pastRecurrences) {
        List<Timestamp> allRecurrences = calculateAllRecurrenceDates(startDate, newRecurrenceData.getFrequency(), newRecurrenceData.getRecurrenceAmount());
        return RecurrenceData.builderFromNewRecurrenceData(newRecurrenceData)
                .allRecurrences(allRecurrences)
                .pastRecurrences(pastRecurrences)
                .build();
    }

    @VisibleForTesting
    public static List<Timestamp> calculateAllRecurrenceDates(Timestamp startDate, RecurrenceData.Frequency frequency, Integer recurrenceAmount) {
        logger.info("Calculating all recurrence dates from {} with a frequency of {} for {} times", startDate, frequency, recurrenceAmount);
        switch (frequency) {
            case WEEKLY:
            case FORTNIGHTLY:
                return IntStream.range(0, recurrenceAmount).mapToObj(recurrenceNumber -> {
                    LocalDateTime recurrenceDateTime = TimeUtils.convertTimestampToLocalDateTime(startDate)
                            .plusDays((long) recurrenceNumber * frequency.getValue());
                    return TimeUtils.convertLocalDateTimeToTimestamp(recurrenceDateTime);
                }).collect(Collectors.toList());
            case MONTHLY:
                return IntStream.range(0, recurrenceAmount).mapToObj(recurrenceNumber -> {
                    LocalDateTime recurrenceDateTime = TimeUtils.convertTimestampToLocalDateTime(startDate)
                            .plusMonths(recurrenceNumber);
                    return TimeUtils.convertLocalDateTimeToTimestamp(recurrenceDateTime);
                }).collect(Collectors.toList());
            default:
                return List.of();
        }
    }
}
