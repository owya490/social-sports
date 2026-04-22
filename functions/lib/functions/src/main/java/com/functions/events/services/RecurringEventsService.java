package com.functions.events.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.functions.events.exceptions.RecurrenceTemplateInUseException;
import com.functions.events.exceptions.RecurrenceTemplateNotFoundException;
import com.functions.events.models.CustomEventLink;
import com.functions.events.models.NewEventData;
import com.functions.events.models.NewRecurrenceData;
import com.functions.events.models.RecurrenceData;
import com.functions.events.models.RecurrenceTemplate;
import com.functions.events.models.responses.DeleteRecurrenceTemplateResponse;
import com.functions.events.repositories.CustomEventLinksRepository;
import com.functions.events.repositories.EventCollectionsRepository;
import com.functions.events.repositories.RecurrenceTemplateRepository;
import com.functions.firebase.services.FirebaseService;
import com.functions.firebase.services.FirebaseService.CollectionPaths;
import com.functions.users.models.PrivateUserData;
import com.functions.users.services.Users;
import com.functions.utils.JavaUtils;
import com.functions.utils.TimeUtils;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.common.annotations.VisibleForTesting;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
        // Calculate all future recurrence Dates
        RecurrenceData recurrenceData = calculateRecurrenceDataForCreate(newRecurrenceData, newEventData.getStartDate());
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
        RecurrenceData recurrenceData = calculateRecurrenceData(newRecurrenceData, newEventData.getStartDate(), pastRecurrences, false);
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

    /**
     * Moves the recurrence template to {@link CollectionPaths#DELETED_RECURRING_EVENTS} and removes its id from the
     * organiser's {@code recurrenceTemplates} list. Fails if the template is referenced by an event collection or
     * custom link.
     */
    public static DeleteRecurrenceTemplateResponse deleteRecurrenceTemplate(String organiserId, String recurrenceTemplateId)
            throws RecurrenceTemplateNotFoundException, RecurrenceTemplateInUseException, Exception {
        RecurrenceTemplate existing = RecurrenceTemplateRepository.getRecurrenceTemplate(recurrenceTemplateId)
                .orElseThrow(() -> new RecurrenceTemplateNotFoundException(recurrenceTemplateId));

        if (!organiserId.equals(existing.getEventData().getOrganiserId())) {
            throw new IllegalArgumentException("Organiser does not own this recurrence template");
        }

        List<String> blockingPrivate =
                EventCollectionsRepository.getEventCollectionIdsContainingRecurringTemplate(true, recurrenceTemplateId);
        List<String> blockingPublic =
                EventCollectionsRepository.getEventCollectionIdsContainingRecurringTemplate(false, recurrenceTemplateId);
        List<String> blockingEventCollectionIds = new ArrayList<>(blockingPrivate);
        blockingEventCollectionIds.addAll(blockingPublic);

        List<CustomEventLink> customLinks =
                CustomEventLinksRepository.getAllEventLinksPointedToRecurrence(organiserId, recurrenceTemplateId);
        List<String> blockingCustomEventLinkPaths = customLinks.stream()
                .map(CustomEventLink::getCustomEventLink)
                .filter(s -> s != null && !s.isEmpty())
                .collect(Collectors.toList());

        if (!blockingEventCollectionIds.isEmpty() || !blockingCustomEventLinkPaths.isEmpty()) {
            throw new RecurrenceTemplateInUseException(
                    "This recurring event is still linked to an event collection or custom link. Remove those links first.",
                    blockingEventCollectionIds,
                    blockingCustomEventLinkPaths);
        }

        String deletedAt = Instant.now().toString();

        return FirebaseService.createFirestoreTransaction(transaction -> {
            DocumentReference sourceRef = RecurrenceTemplateRepository
                    .findRecurrenceTemplateDocumentReference(recurrenceTemplateId, transaction);
            RecurrenceTemplate template = transaction.get(sourceRef).get().toObject(RecurrenceTemplate.class);
            if (template == null || !organiserId.equals(template.getEventData().getOrganiserId())) {
                throw new IllegalArgumentException("Organiser does not own this recurrence template");
            }

            Map<String, Object> deletedDoc =
                    JavaUtils.objectMapper.convertValue(template, new TypeReference<Map<String, Object>>() {});
            deletedDoc.put("deletedAt", deletedAt);

            Firestore db = FirebaseService.getFirestore();
            DocumentReference deletedRef =
                    db.collection(CollectionPaths.DELETED_RECURRING_EVENTS).document(recurrenceTemplateId);
            transaction.set(deletedRef, deletedDoc);
            transaction.delete(sourceRef);

            DocumentReference userRef = db.collection(CollectionPaths.USERS)
                    .document(CollectionPaths.ACTIVE)
                    .collection(CollectionPaths.PRIVATE)
                    .document(organiserId);
            transaction.update(userRef, "recurrenceTemplates", FieldValue.arrayRemove(recurrenceTemplateId));

            return new DeleteRecurrenceTemplateResponse(recurrenceTemplateId, deletedAt);
        });
    }

    private static RecurrenceData calculateRecurrenceDataForCreate(NewRecurrenceData newRecurrenceData, Timestamp startDate) {
        return calculateRecurrenceData(newRecurrenceData, startDate, Map.of(), true);
    }

    private static RecurrenceData calculateRecurrenceData(NewRecurrenceData newRecurrenceData, Timestamp startDate, Map<String, String> pastRecurrences, boolean isCreate) {
        List<Timestamp> allRecurrences = calculateAllRecurrenceDates(startDate, newRecurrenceData.getFrequency(), newRecurrenceData.getRecurrenceAmount(), isCreate);
        return RecurrenceData.builderFromNewRecurrenceData(newRecurrenceData)
                .allRecurrences(allRecurrences)
                .pastRecurrences(pastRecurrences)
                .build();
    }

    @VisibleForTesting
    public static List<Timestamp> calculateAllRecurrenceDates(Timestamp startDate, RecurrenceData.Frequency frequency, Integer recurrenceAmount, boolean isCreate) {
        logger.info("Calculating all recurrence dates from {} with a frequency of {} for {} times", startDate, frequency, recurrenceAmount);
        int starting = isCreate ? 0 : 1;
        switch (frequency) {
            case WEEKLY:
            case FORTNIGHTLY:
                // We want to do recurrenceAmount + 1 as we count the initial date as a recurrence, but not in the UI
                return IntStream.range(starting, recurrenceAmount + 1).mapToObj(recurrenceNumber -> {
                    logger.info("recurrenceNumber {}", recurrenceNumber);
                    LocalDateTime recurrenceDateTime = TimeUtils.convertTimestampToLocalDateTime(startDate)
                            .plusDays((long) recurrenceNumber * frequency.getValue());
                    return TimeUtils.convertLocalDateTimeToTimestamp(recurrenceDateTime);
                }).collect(Collectors.toList());
            case MONTHLY:
                // We want to do recurrenceAmount + 1 as we count the initial date as a recurrence, but not in the UI
                return IntStream.range(starting, recurrenceAmount + 1).mapToObj(recurrenceNumber -> {
                    LocalDateTime recurrenceDateTime = TimeUtils.convertTimestampToLocalDateTime(startDate)
                            .plusMonths(recurrenceNumber);
                    return TimeUtils.convertLocalDateTimeToTimestamp(recurrenceDateTime);
                }).collect(Collectors.toList());
            default:
                return List.of();
        }
    }
}
