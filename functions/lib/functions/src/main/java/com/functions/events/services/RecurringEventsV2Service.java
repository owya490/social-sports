package com.functions.events.services;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.NewEventData;
import com.functions.events.models.RecurrenceData;
import com.functions.events.models.RecurrenceOccurrence;
import com.functions.events.models.RecurrenceTemplate;
import com.functions.events.models.ReservedSlot;
import com.functions.events.models.requests.CreateRecurrenceTemplateV2Request;
import com.functions.events.models.requests.UpdateRecurrenceTemplateV2Request;
import com.functions.events.models.responses.CreateRecurrenceTemplateV2Response;
import com.functions.events.models.responses.UpdateRecurrenceTemplateV2Response;
import com.functions.events.repositories.RecurrenceTemplateRepository;
import com.functions.users.models.PrivateUserData;
import com.functions.users.services.Users;
import com.functions.utils.TimeUtils;
import com.google.cloud.Timestamp;
import com.google.common.annotations.VisibleForTesting;

public class RecurringEventsV2Service {
    private static final Logger logger = LoggerFactory.getLogger(RecurringEventsV2Service.class);

    public static final int MAX_OCCURRENCES = 100;

    public static CreateRecurrenceTemplateV2Response createRecurrenceTemplate(
            CreateRecurrenceTemplateV2Request request) throws Exception {
        if (request == null || request.eventData() == null) {
            throw new IllegalArgumentException("eventData is required");
        }
        NewEventData eventData = request.eventData();
        if (eventData.getOrganiserId() == null || eventData.getOrganiserId().isBlank()) {
            throw new IllegalArgumentException("organiserId is required");
        }

        boolean recurrenceEnabled = request.recurrenceEnabled() == null || request.recurrenceEnabled();
        List<ReservedSlot> reservedSlots = request.reservedSlots() == null
                ? new ArrayList<>()
                : new ArrayList<>(request.reservedSlots());
        List<RecurrenceOccurrence> occurrences = normalizeAndValidateOccurrences(request.occurrences());

        RecurrenceData recurrenceData = RecurrenceData.builder()
                .recurrenceEnabled(recurrenceEnabled)
                .reservedSlots(reservedSlots)
                .occurrences(occurrences)
                .build();
        RecurrenceTemplate template = RecurrenceTemplate.builder()
                .schemaVersion(RecurrenceTemplate.SCHEMA_VERSION_V2)
                .eventData(eventData)
                .recurrenceData(recurrenceData)
                .build();

        boolean isActive = Boolean.TRUE.equals(eventData.getIsActive());
        boolean isPrivate = Boolean.TRUE.equals(eventData.getIsPrivate());
        String recurrenceTemplateId = RecurrenceTemplateRepository.createRecurrenceTemplate(
                isActive, isPrivate, template);

        PrivateUserData privateUserData = Users.getPrivateUserDataById(eventData.getOrganiserId());
        if (privateUserData == null) {
            throw new IllegalStateException("Private user data not found for organiser " + eventData.getOrganiserId());
        }
        List<String> recurrenceTemplates = privateUserData.getRecurrenceTemplates() == null
                ? new ArrayList<>()
                : new ArrayList<>(privateUserData.getRecurrenceTemplates());
        recurrenceTemplates.add(recurrenceTemplateId);
        privateUserData.setRecurrenceTemplates(recurrenceTemplates);
        Users.updatePrivateUserData(eventData.getOrganiserId(), privateUserData);

        List<String> createdEventIds = RecurringEventsCronService.createEventsFromRecurrenceTemplates(
                sydneyToday(), recurrenceTemplateId, false);
        String firstEventId = createdEventIds.isEmpty() ? null : createdEventIds.get(0);
        logger.info("Created v2 recurrence template {} firstEventId={}", recurrenceTemplateId, firstEventId);
        return new CreateRecurrenceTemplateV2Response(recurrenceTemplateId, firstEventId);
    }

    public static UpdateRecurrenceTemplateV2Response updateRecurrenceTemplate(
            UpdateRecurrenceTemplateV2Request request) throws Exception {
        if (request == null || request.recurrenceTemplateId() == null || request.recurrenceTemplateId().isBlank()) {
            throw new IllegalArgumentException("recurrenceTemplateId is required");
        }

        RecurrenceTemplate current = RecurrenceTemplateRepository.getRecurrenceTemplate(request.recurrenceTemplateId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Recurrence template not found: " + request.recurrenceTemplateId()));
        if (!current.isV2()) {
            throw new IllegalArgumentException("Recurrence template is not v2: " + request.recurrenceTemplateId());
        }

        NewEventData eventData = request.eventData() != null ? request.eventData() : current.getEventData();
        RecurrenceData currentRecurrence = current.getRecurrenceData();
        boolean recurrenceEnabled = request.recurrenceEnabled() != null
                ? request.recurrenceEnabled()
                : Boolean.TRUE.equals(currentRecurrence.getRecurrenceEnabled());
        List<ReservedSlot> reservedSlots = request.reservedSlots() != null
                ? new ArrayList<>(request.reservedSlots())
                : (currentRecurrence.getReservedSlots() == null
                        ? new ArrayList<>()
                        : new ArrayList<>(currentRecurrence.getReservedSlots()));
        List<RecurrenceOccurrence> occurrences = request.occurrences() == null
                ? existingOccurrences(currentRecurrence)
                : mergeOccurrencesForUpdate(existingOccurrences(currentRecurrence), request.occurrences());

        RecurrenceData recurrenceData = RecurrenceData.builder()
                .recurrenceEnabled(recurrenceEnabled)
                .reservedSlots(reservedSlots)
                .occurrences(occurrences)
                .build();
        RecurrenceTemplate updated = RecurrenceTemplate.builder()
                .schemaVersion(RecurrenceTemplate.SCHEMA_VERSION_V2)
                .eventData(eventData)
                .recurrenceData(recurrenceData)
                .build();

        RecurrenceTemplateRepository.updateRecurrenceTemplate(request.recurrenceTemplateId(), updated);

        boolean currentlyActive = Boolean.TRUE.equals(current.getEventData().getIsActive());
        if (!currentlyActive && recurrenceEnabled && hasPendingOccurrences(occurrences)) {
            RecurrenceTemplateRepository.moveRecurrenceTemplateToActive(request.recurrenceTemplateId(), updated);
            logger.info("Moved v2 recurrence template {} back to active", request.recurrenceTemplateId());
        }

        List<String> createdEventIds = RecurringEventsCronService.createEventsFromRecurrenceTemplates(
                sydneyToday(), request.recurrenceTemplateId(), false);
        String firstEventId = createdEventIds.isEmpty() ? null : createdEventIds.get(0);
        logger.info("Updated v2 recurrence template {} firstCreatedEventId={}",
                request.recurrenceTemplateId(), firstEventId);
        return new UpdateRecurrenceTemplateV2Response(request.recurrenceTemplateId(), firstEventId);
    }

    @VisibleForTesting
    public static List<RecurrenceOccurrence> normalizeAndValidateOccurrences(
            List<RecurrenceOccurrence> incoming) {
        if (incoming == null || incoming.isEmpty()) {
            throw new IllegalArgumentException("At least one occurrence is required");
        }
        if (incoming.size() > MAX_OCCURRENCES) {
            throw new IllegalArgumentException("A series cannot have more than " + MAX_OCCURRENCES + " occurrences");
        }

        Set<String> occurrenceIds = new HashSet<>();
        Set<LocalDate> eventDates = new HashSet<>();
        List<RecurrenceOccurrence> normalized = new ArrayList<>();
        for (RecurrenceOccurrence occurrence : incoming) {
            if (occurrence == null || occurrence.getEventStart() == null || occurrence.getCreateDate() == null) {
                throw new IllegalArgumentException("Each occurrence requires eventStart and createDate");
            }
            String occurrenceId = occurrence.getOccurrenceId() == null || occurrence.getOccurrenceId().isBlank()
                    ? UUID.randomUUID().toString()
                    : occurrence.getOccurrenceId().trim();
            if (!occurrenceIds.add(occurrenceId)) {
                throw new IllegalArgumentException("Duplicate occurrenceId: " + occurrenceId);
            }
            LocalDate eventDate = TimeUtils.toSydneyLocalDate(occurrence.getEventStart());
            if (!eventDates.add(eventDate)) {
                throw new IllegalArgumentException("Duplicate event date: " + eventDate);
            }
            Timestamp createDate = TimeUtils.normalizeToSydneyStartOfDay(occurrence.getCreateDate());
            if (TimeUtils.toSydneyLocalDate(createDate).isAfter(eventDate)) {
                throw new IllegalArgumentException("createDate cannot be after eventStart for occurrence " + occurrenceId);
            }
            String eventId = occurrence.getEventId() == null || occurrence.getEventId().isBlank()
                    ? null
                    : occurrence.getEventId();
            normalized.add(RecurrenceOccurrence.builder()
                    .occurrenceId(occurrenceId)
                    .eventStart(occurrence.getEventStart())
                    .createDate(createDate)
                    .eventId(eventId)
                    .build());
        }
        normalized.sort(Comparator.comparing(RecurrenceOccurrence::getEventStart));
        return normalized;
    }

    @VisibleForTesting
    public static List<RecurrenceOccurrence> mergeOccurrencesForUpdate(
            List<RecurrenceOccurrence> existing,
            List<RecurrenceOccurrence> incoming) {
        Map<String, RecurrenceOccurrence> existingById = existing.stream()
                .collect(Collectors.toMap(RecurrenceOccurrence::getOccurrenceId, occurrence -> occurrence));
        List<RecurrenceOccurrence> createdMissing = existing.stream()
                .filter(RecurrenceOccurrence::isCreated)
                .filter(occurrence -> incoming.stream()
                        .noneMatch(candidate -> occurrence.getOccurrenceId().equals(candidate.getOccurrenceId())))
                .toList();
        if (!createdMissing.isEmpty()) {
            throw new IllegalArgumentException(
                    "Created occurrences cannot be removed: " + createdMissing.stream()
                            .map(RecurrenceOccurrence::getOccurrenceId)
                            .collect(Collectors.joining(", ")));
        }

        List<RecurrenceOccurrence> mergedIncoming = new ArrayList<>();
        for (RecurrenceOccurrence candidate : incoming) {
            if (candidate == null || candidate.getOccurrenceId() == null || candidate.getOccurrenceId().isBlank()) {
                mergedIncoming.add(candidate);
                continue;
            }
            RecurrenceOccurrence previous = existingById.get(candidate.getOccurrenceId());
            if (previous != null && previous.isCreated()) {
                if (candidate.getEventId() == null || !previous.getEventId().equals(candidate.getEventId())) {
                    throw new IllegalArgumentException(
                            "Created occurrence eventId cannot change: " + previous.getOccurrenceId());
                }
                if (candidate.getEventStart() == null
                        || previous.getEventStart().compareTo(candidate.getEventStart()) != 0) {
                    throw new IllegalArgumentException(
                            "Created occurrence eventStart cannot change: " + previous.getOccurrenceId());
                }
                mergedIncoming.add(previous.toBuilder()
                        .createDate(previous.getCreateDate())
                        .build());
            } else {
                if (candidate.getEventId() != null && !candidate.getEventId().isBlank()) {
                    throw new IllegalArgumentException(
                            "Pending occurrences cannot include eventId: " + candidate.getOccurrenceId());
                }
                mergedIncoming.add(candidate.toBuilder().eventId(null).build());
            }
        }
        return normalizeAndValidateOccurrences(mergedIncoming);
    }

    @VisibleForTesting
    public static RecurrenceOccurrence findNextOccurrenceToCreate(RecurrenceData recurrenceData, LocalDate today) {
        if (recurrenceData == null || !Boolean.TRUE.equals(recurrenceData.getRecurrenceEnabled())) {
            return null;
        }
        List<RecurrenceOccurrence> occurrences = recurrenceData.getOccurrences();
        if (occurrences == null || occurrences.isEmpty()) {
            return null;
        }
        return occurrences.stream()
                .filter(occurrence -> !occurrence.isCreated())
                .filter(occurrence -> !TimeUtils.toSydneyLocalDate(occurrence.getCreateDate()).isAfter(today))
                .min(Comparator.comparing(RecurrenceOccurrence::getEventStart))
                .orElse(null);
    }

    @VisibleForTesting
    public static boolean shouldMoveTemplateToInactive(RecurrenceData recurrenceData) {
        if (recurrenceData == null || !Boolean.TRUE.equals(recurrenceData.getRecurrenceEnabled())) {
            return true;
        }
        List<RecurrenceOccurrence> occurrences = recurrenceData.getOccurrences();
        if (occurrences == null || occurrences.isEmpty()) {
            return true;
        }
        return occurrences.stream().allMatch(RecurrenceOccurrence::isCreated);
    }

    public static String eventIdForOccurrence(String occurrenceId) {
        if (occurrenceId == null || occurrenceId.isBlank()) {
            throw new IllegalArgumentException("occurrenceId is required to derive an event id");
        }
        return UUID.nameUUIDFromBytes(("recurring-v2:" + occurrenceId).getBytes(StandardCharsets.UTF_8)).toString();
    }

    public static List<RecurrenceOccurrence> withEventId(
            List<RecurrenceOccurrence> occurrences,
            String occurrenceId,
            String eventId) {
        List<RecurrenceOccurrence> updated = new ArrayList<>(occurrences.size());
        for (RecurrenceOccurrence occurrence : occurrences) {
            if (occurrenceId.equals(occurrence.getOccurrenceId())) {
                updated.add(occurrence.toBuilder().eventId(eventId).build());
            } else {
                updated.add(occurrence);
            }
        }
        return updated;
    }

    private static List<RecurrenceOccurrence> existingOccurrences(RecurrenceData recurrenceData) {
        if (recurrenceData == null || recurrenceData.getOccurrences() == null) {
            return new ArrayList<>();
        }
        return new ArrayList<>(recurrenceData.getOccurrences());
    }

    private static boolean hasPendingOccurrences(List<RecurrenceOccurrence> occurrences) {
        return occurrences.stream().anyMatch(occurrence -> !occurrence.isCreated());
    }

    private static LocalDate sydneyToday() {
        return ZonedDateTime.now(TimeUtils.SYDNEY_TIMEZONE).toLocalDate();
    }
}
