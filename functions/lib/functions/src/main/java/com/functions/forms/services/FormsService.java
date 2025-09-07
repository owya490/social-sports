package com.functions.forms.services;

import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.repositories.EventsRepository;
import com.functions.forms.models.DateTimeSection;
import com.functions.forms.models.DropdownSelectSection;
import com.functions.forms.models.FileUploadSection;
import com.functions.forms.models.FormResponse;
import com.functions.forms.models.FormSection;
import com.functions.forms.models.MultipleChoiceSection;
import com.functions.forms.models.TextSection;
import com.functions.forms.repositories.FormsRepository;

public class FormsService {
    private static final Logger logger = LoggerFactory.getLogger(FormsService.class);

    public static Optional<String> getFormIdByEventId(String eventId) {
        try {
            return EventsRepository.getEventById(eventId).map(maybeEventData -> {
                String maybeFormId = maybeEventData.getFormId();
                if (maybeFormId != null) {
                    logger.info("Found form ID {} for event ID {}", maybeFormId, eventId);
                    return maybeFormId;
                } else {
                    logger.warn("No form ID found for event ID {}", eventId);
                    return null;
                }
            });
        } catch (Exception e) {
            logger.error("Error trying to get form ID for event ID {}: {}", eventId, e.getMessage());
            throw new RuntimeException("[FormsService] Failed to retrieve form ID for event ID: " + eventId, e);
        }
    }

    /**
     * Saves a FormResponse as a temporary submission.
     * The form response must be complete (all required sections answered) to be
     * saved.
     * 
     * @param formResponse The FormResponse to save
     * @return The generated formResponseId
     * @throws RuntimeException if there's an error saving the form response
     */
    public static Optional<String> saveTempFormResponse(FormResponse formResponse) {
        try {
            if (!isFormResponseComplete(formResponse)) {
                logger.error(
                        "[FormsService] Trying to save incomplete form response for formId: {}, eventId: {}, formResponse: {}",
                        formResponse.getFormId(), formResponse.getEventId(), formResponse);
                return Optional.empty();
            }

            logger.info("Saving temporary form response for formId: {}, eventId: {}",
                    formResponse.getFormId(), formResponse.getEventId());

            // Generate a unique formResponseId if not already set
            String formResponseId = formResponse.getFormResponseId();
            if (formResponseId == null || formResponseId.isEmpty()) {
                formResponseId = UUID.randomUUID().toString();
                formResponse.setFormResponseId(formResponseId);
            }

            // Clear the submission time for temp form responses
            formResponse.setSubmissionTime(null);

            FormsRepository.saveTempFormResponse(formResponse);

            logger.info("Successfully saved temporary form response with ID: {}", formResponseId);
            return Optional.of(formResponseId);
        } catch (Exception e) {
            logger.error("[FormsService] Error saving temporary form response: {} - {}",
                    formResponse, e.getMessage());
            return Optional.empty();
        }
    }

    public static boolean isFormResponseComplete(FormResponse formResponse) {
        logger.info("[FormsService] Checking if form response is complete: {}",
                formResponse);
        if (formResponse == null || formResponse.getResponseMap() == null) {
            logger.info("[FormsService] Form response is null or has no response map: {}", formResponse);
            return false;
        }
        // Check if all required sections have answers which are non-empty
        for (String sectionId : formResponse.getResponseSectionsOrder()) {
            FormSection section = formResponse.getResponseMap().get(sectionId);
            logger.info("[FormsService] Checking sectionId: {}, section: {}", sectionId, section);
            if (section == null) {
                logger.error("[FormsService] Missing section in response map: {}, returning false", sectionId);
                return false;
            }

            if (!section.isRequired()) {
                logger.info("[FormsService] Section {} is not required, skipping: {}", sectionId, section);
                continue;
            }

            switch (section.getType()) {
                case TEXT:
                    if (!((TextSection) section).hasAnswer()) {
                        return false;
                    }
                    break;
                case MULTIPLE_CHOICE:
                    if (!((MultipleChoiceSection) section).hasAnswer()) {
                        return false;
                    }
                    break;
                case DROPDOWN_SELECT:
                    if (!((DropdownSelectSection) section).hasAnswer()) {
                        return false;
                    }
                    break;
                case FILE_UPLOAD:
                    if (!((FileUploadSection) section).hasFileUrl()) {
                        return false;
                    }
                    break;
                case DATE_TIME:
                    if (!((DateTimeSection) section).hasTimestamp()) {
                        return false;
                    }
                    break;
                default:
                    logger.error("[FormsService] Unknown section type: {}", section.getType());
                    return false;
            }
        }
        logger.info("[FormsService] Form response is complete: {}", formResponse);
        return true;
    }

    /**
     * Copies a temporary form response to the submitted collection and deletes the
     * temporary version
     * 
     * @param formId         The form ID
     * @param eventId        The event ID
     * @param formResponseId The form response ID
     * @throws RuntimeException if there's an error during the copy operation
     */
    public static void copyTempFormResponseToSubmitted(String formId, String eventId, String formResponseId) {
        try {
            logger.info(
                    "Starting copy of temporary form response to submitted - formId: {}, eventId: {}, formResponseId: {}",
                    formId, eventId, formResponseId);

            // Step 1: Get the temporary form response
            FormResponse tempFormResponse = FormsRepository.getTempFormResponseById(formId, eventId,
                    formResponseId);

            // Step 2: Set submission time for the final submission
            tempFormResponse.setSubmissionTime(com.google.cloud.Timestamp.now());

            // Step 3: Save to submitted collection
            FormsRepository.saveSubmittedFormResponse(tempFormResponse);
            logger.info("Successfully saved form response to submitted collection");

            // Step 4: Delete from temporary collection
            FormsRepository.deleteTempFormResponse(formId, eventId, formResponseId);
            logger.info("Successfully deleted temporary form response");

            logger.info(
                    "Successfully copied temporary form response to submitted - formId: {}, eventId: {}, formResponseId: {}",
                    formId, eventId, formResponseId);
        } catch (Exception e) {
            logger.error(
                    "[FormsService] Error copying temporary form response to submitted - formId: {}, eventId: {}, formResponseId: {}: {}",
                    formId, eventId, formResponseId, e.getMessage());
            throw new RuntimeException("[FormsService] Failed to copy temporary form response to submitted - formId: " +
                    formId + ", eventId: " + eventId + ", formResponseId: " + formResponseId, e);
        }
    }
}