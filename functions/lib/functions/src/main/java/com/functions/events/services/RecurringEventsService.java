package com.functions.events.services;

import com.functions.events.exceptions.RecurrenceTemplateNotFoundException;
import com.functions.events.models.NewEventData;
import com.functions.events.models.NewRecurrenceData;
import com.functions.events.models.RecurrenceData;
import com.functions.events.models.RecurrenceTemplate;
import com.functions.events.repositories.EventCollectionsRepository;
import com.functions.events.repositories.RecurrenceTemplateRepository;
import com.functions.firebase.services.FirebaseService;
import com.functions.users.models.PrivateUserData;
import com.functions.users.services.Users;
import com.functions.utils.TimeUtils;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.common.annotations.VisibleForTesting;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.LocalDateTime;
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

    public static void deleteRecurrenceTemplate(String recurrenceTemplateId, String organiserId) throws Exception {
        FirebaseService.createFirestoreTransaction(transaction -> {
            // Reads first. A retried transaction must not write before these queries finish.
            // The same template id can exist in more than one active/private location.
            List<DocumentReference> templateRefs = RecurrenceTemplateRepository
                    .findRecurrenceTemplateRefs(recurrenceTemplateId, transaction);
            if (templateRefs.isEmpty()) {
                throw new RecurrenceTemplateNotFoundException(recurrenceTemplateId);
            }
            // Collections store their own list of series ids.
            List<DocumentReference> collections = EventCollectionsService
                    .getEventCollectionDocumentsContainingRecurringTemplate(recurrenceTemplateId, transaction);
            // Links are stored under the organiser and point at this template by id.
            List<DocumentSnapshot> links = CustomEventLinksService
                    .getEventLinkDocumentsPointedToRecurrence(organiserId, recurrenceTemplateId, transaction);

            // Delete every copy of the template.
            for (DocumentReference templateRef : templateRefs) {
                transaction.delete(templateRef);
            }
            // Leave each collection in place and drop this series from its list.
            for (DocumentReference collection : collections) {
                EventCollectionsRepository.removeRecurringTemplateId(collection, recurrenceTemplateId, transaction);
            }
            // Leave each custom link in place and clear the fields that pointed at this series.
            CustomEventLinksService.clearRecurrenceTemplateReference(links, transaction);
            // Take the series off the organiser's private list.
            Users.removeRecurrenceTemplate(organiserId, recurrenceTemplateId, transaction);
            return null;
        });
        logger.info("Deleted recurrence template {}", recurrenceTemplateId);
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
