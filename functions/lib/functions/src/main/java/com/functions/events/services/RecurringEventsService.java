package com.functions.events.services;

import com.functions.events.models.NewEventData;
import com.functions.events.models.NewRecurrenceData;
import com.functions.events.models.RecurrenceData;
import com.functions.events.models.RecurrenceTemplate;
import com.functions.events.repositories.RecurrenceTemplateRepository;
import com.functions.events.utils.EventTimeZone;
import com.functions.users.models.PrivateUserData;
import com.functions.users.services.Users;
import com.functions.utils.TimeUtils;
import com.google.cloud.Timestamp;
import com.google.common.annotations.VisibleForTesting;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

public class RecurringEventsService {
    private static final Logger logger = LoggerFactory.getLogger(RecurringEventsService.class);

    // Returns Map.Entry<RecurrenceTemplateId, EventId>
    public static Optional<Map.Entry<String, String>> createRecurrenceTemplate(NewEventData newEventData, NewRecurrenceData newRecurrenceData) {
        // Calculate all future recurrence Dates in the venue zone.
        ZoneId zone = EventTimeZone.stamp(newEventData);
        RecurrenceData recurrenceData = calculateRecurrenceDataForCreate(newRecurrenceData, newEventData, zone);
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
            String eventId = RecurringEventsCronService.createEventsFromRecurrenceTemplates(LocalDate.now(), recurrenceTemplateId, true).stream().findFirst().orElseThrow(() -> new Exception("Failed to create initial event for recurrence template: " + recurrenceTemplateId));
            logger.info("Successfully created new Recurrence Template {}", recurrenceTemplateId);
            return Optional.of(Map.entry(recurrenceTemplateId, eventId));
        } catch (Exception e) {
            logger.error("Error when creating new Recurrence Template", e);
            return Optional.empty();
        }
    }

    public static Optional<String> updateRecurrenceTemplate(String recurrenceTemplateId,
            RecurrenceTemplate currentRecurrenceTemplate, NewEventData newEventData,
            NewRecurrenceData newRecurrenceData) {
        logger.info("Recurrence template found {} {}", recurrenceTemplateId, currentRecurrenceTemplate);
        Map<String, String> pastRecurrences = currentRecurrenceTemplate.getRecurrenceData().getPastRecurrences();

        if (newEventData == null) {
            newEventData = currentRecurrenceTemplate.getEventData();
        }
        if (newRecurrenceData == null) {
            newRecurrenceData = currentRecurrenceTemplate.getRecurrenceData().extractNewRecurrenceData();
        }

        // A moved pin keeps the previous wall clock when the instants were not retyped.
        EventTimeZone.retainWallClockIfPinMoved(currentRecurrenceTemplate.getEventData(), newEventData);
        // Recalculate in the venue zone, but keep timestamps already written to pastRecurrences.
        ZoneId zone = EventTimeZone.stamp(newEventData);
        RecurrenceData recurrenceData = calculateRecurrenceData(
                newRecurrenceData,
                newEventData.getStartDate(),
                currentRecurrenceTemplate.getRecurrenceData().getAllRecurrences(),
                currentRecurrenceTemplate.getEventData().getStartDate(),
                pastRecurrences,
                false,
                zone);
        RecurrenceTemplate recurrenceTemplate = RecurrenceTemplate.builder()
                .eventData(newEventData)
                .recurrenceData(recurrenceData)
                .build();

        // Place content in the firestore database
        try {
            String templateId = RecurrenceTemplateRepository.updateRecurrenceTemplate(recurrenceTemplateId, recurrenceTemplate);
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

            return Optional.of(templateId);
        } catch (ExecutionException | InterruptedException e) {
            logger.error("Error when updating Recurrence Template {}", recurrenceTemplateId, e);
            return Optional.empty();
        }
    }

    private static RecurrenceData calculateRecurrenceDataForCreate(NewRecurrenceData newRecurrenceData, NewEventData eventData, ZoneId zone) {
        return calculateRecurrenceData(newRecurrenceData, eventData.getStartDate(), List.of(), null, Map.of(), true, zone);
    }

    private static RecurrenceData calculateRecurrenceData(NewRecurrenceData newRecurrenceData, Timestamp startDate,
            List<Timestamp> existingRecurrences, Timestamp existingAnchor, Map<String, String> pastRecurrences,
            boolean isCreate, ZoneId zone) {
        List<Timestamp> allRecurrences = scheduleRespectingCreatedOccurrences(
                startDate,
                newRecurrenceData.getFrequency(),
                newRecurrenceData.getRecurrenceAmount(),
                isCreate,
                zone,
                existingRecurrences,
                existingAnchor,
                pastRecurrences);
        return RecurrenceData.builderFromNewRecurrenceData(newRecurrenceData)
                .allRecurrences(allRecurrences)
                .pastRecurrences(pastRecurrences)
                .build();
    }

    /**
     * Wall-clock dates for slots that have not been created, and the stored timestamp
     * for an ordinal already present in {@code pastRecurrences}. That stored timestamp
     * is the occurrence identity the cron dedupes on.
     */
    @VisibleForTesting
    public static List<Timestamp> scheduleRespectingCreatedOccurrences(Timestamp startDate,
            RecurrenceData.Frequency frequency, Integer recurrenceAmount, boolean isCreate, ZoneId zone,
            List<Timestamp> existingRecurrences, Timestamp existingAnchor, Map<String, String> pastRecurrences) {
        List<Timestamp> calculated = calculateAllRecurrenceDates(startDate, frequency, recurrenceAmount, isCreate, zone);
        return preserveCreatedOccurrences(calculated, existingRecurrences, existingAnchor, isCreate, pastRecurrences);
    }

    @VisibleForTesting
    public static List<Timestamp> calculateAllRecurrenceDates(Timestamp startDate, RecurrenceData.Frequency frequency, Integer recurrenceAmount, boolean isCreate, ZoneId zone) {
        ZoneId eventZone = zone == null ? EventTimeZone.FALLBACK : zone;
        ZonedDateTime start = Instant.ofEpochSecond(startDate.getSeconds(), startDate.getNanos()).atZone(eventZone);
        logger.info("Calculating all recurrence dates from {} with a frequency of {} for {} times in {}", startDate, frequency, recurrenceAmount, eventZone);
        int starting = isCreate ? 0 : 1;
        switch (frequency) {
            case WEEKLY:
            case FORTNIGHTLY:
                // We want to do recurrenceAmount + 1 as we count the initial date as a recurrence, but not in the UI
                return IntStream.range(starting, recurrenceAmount + 1).mapToObj(recurrenceNumber -> {
                    logger.info("recurrenceNumber {}", recurrenceNumber);
                    return TimeUtils.convertZonedDateTimeToTimestamp(
                            start.plusDays((long) recurrenceNumber * frequency.getValue()));
                }).collect(Collectors.toList());
            case MONTHLY:
                // We want to do recurrenceAmount + 1 as we count the initial date as a recurrence, but not in the UI
                return IntStream.range(starting, recurrenceAmount + 1).mapToObj(recurrenceNumber ->
                        TimeUtils.convertZonedDateTimeToTimestamp(start.plusMonths(recurrenceNumber))
                ).collect(Collectors.toList());
            default:
                return List.of();
        }
    }

    static List<Timestamp> preserveCreatedOccurrences(List<Timestamp> calculated, List<Timestamp> existingRecurrences,
            Timestamp existingAnchor, boolean calculatedIncludesAnchor, Map<String, String> pastRecurrences) {
        if (calculated == null || calculated.isEmpty()
                || existingRecurrences == null || existingRecurrences.isEmpty()
                || pastRecurrences == null || pastRecurrences.isEmpty()) {
            return calculated == null ? List.of() : calculated;
        }
        // Creation stores the anchor at index 0. A later save omits it, so the two lists can be off by one.
        boolean existingIncludesAnchor = sameTimestamp(existingRecurrences.get(0), existingAnchor);
        int existingOffset;
        if (existingIncludesAnchor == calculatedIncludesAnchor) {
            existingOffset = 0;
        } else if (existingIncludesAnchor) {
            existingOffset = 1;
        } else {
            existingOffset = -1;
        }
        List<Timestamp> reconciled = new ArrayList<>(calculated.size());
        for (int i = 0; i < calculated.size(); i++) {
            int existingIndex = i + existingOffset;
            if (existingIndex >= 0 && existingIndex < existingRecurrences.size()
                    && occurrenceRecorded(existingRecurrences.get(existingIndex), pastRecurrences)) {
                reconciled.add(existingRecurrences.get(existingIndex));
            } else {
                reconciled.add(calculated.get(i));
            }
        }
        return reconciled;
    }

    private static boolean occurrenceRecorded(Timestamp occurrence, Map<String, String> pastRecurrences) {
        if (occurrence == null) {
            return false;
        }
        // Ledger keys stay in the Sydney format written by the cron, including for other venue zones.
        String key = TimeUtils.getTimestampStringFromTimezone(occurrence, EventTimeZone.FALLBACK);
        return pastRecurrences.containsKey(key);
    }

    private static boolean sameTimestamp(Timestamp left, Timestamp right) {
        return left != null && right != null
                && left.getSeconds() == right.getSeconds()
                && left.getNanos() == right.getNanos();
    }
}
