package com.functions.forms.services;

import com.functions.events.repositories.EventsRepository;
import com.functions.forms.models.DateTimeSection;
import com.functions.forms.models.DropdownSelectSection;
import com.functions.forms.models.FileUploadSection;
import com.functions.forms.models.FormResponse;
import com.functions.forms.models.FormSection;
import com.functions.forms.models.ImageSection;
import com.functions.forms.models.MultipleChoiceSection;
import com.functions.forms.models.TextSection;
import com.functions.forms.repositories.FormsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Optional;

public class FormsUtils {
    private static final Logger logger = LoggerFactory.getLogger(FormsUtils.class);

    public static Optional<String> getFormIdByEventId(String eventId) {
        logger.debug("Retrieving form ID for event ID: {}", eventId);

        if (eventId == null || eventId.trim().isEmpty()) {
            logger.warn("Invalid event ID provided: {}", eventId);
            return Optional.empty();
        }

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
            logger.error("Error trying to get form ID for event ID {}: {}", eventId, e.getMessage(),
                    e);
            throw new RuntimeException(
                    "[FormsUtils] Failed to retrieve form ID for event ID: " + eventId, e);
        }
    }


    public static boolean isFormResponseComplete(FormResponse formResponse) {
        logger.debug("Checking if form response is complete for formId: {}, eventId: {}",
                formResponse != null ? formResponse.getFormId() : "null",
                formResponse != null ? formResponse.getEventId() : "null");

        if (formResponse == null) {
            logger.warn("Form response is null, returning false");
            return false;
        }

        if (formResponse.getResponseMap() == null) {
            logger.warn("Form response has no response map - formId: {}, eventId: {}",
                    formResponse.getFormId(), formResponse.getEventId());
            return false;
        }

        if (formResponse.getResponseSectionsOrder() == null
                || formResponse.getResponseSectionsOrder().isEmpty()) {
            logger.warn("Form response has no sections order - formId: {}, eventId: {}",
                    formResponse.getFormId(), formResponse.getEventId());
            return false;
        }

        logger.debug("Validating {} sections for completeness",
                formResponse.getResponseSectionsOrder().size());

        // Check if all required sections have answers which are non-empty
        for (String sectionId : formResponse.getResponseSectionsOrder()) {
            FormSection section = formResponse.getResponseMap().get(sectionId);
            logger.debug("Validating section: {} of type: {}", sectionId,
                    section != null ? section.getType() : "null");

            if (section == null) {
                logger.error("Missing section in response map: {}, form incomplete", sectionId);
                return false;
            }

            if (!section.isRequired()) {
                logger.debug("Section {} is not required, skipping validation", sectionId);
                continue;
            }

            switch (section.getType()) {
                case TEXT:
                    if (!((TextSection) section).hasAnswer()) {
                        logger.debug("Required TEXT section {} is incomplete", sectionId);
                        return false;
                    }
                    break;
                case MULTIPLE_CHOICE:
                    if (!((MultipleChoiceSection) section).hasAnswer()) {
                        logger.debug("Required MULTIPLE_CHOICE section {} is incomplete",
                                sectionId);
                        return false;
                    }
                    break;
                case DROPDOWN_SELECT:
                    if (!((DropdownSelectSection) section).hasAnswer()) {
                        logger.debug("Required DROPDOWN_SELECT section {} is incomplete",
                                sectionId);
                        return false;
                    }
                    break;
                case FILE_UPLOAD:
                    if (!((FileUploadSection) section).hasFileUrl()) {
                        logger.debug("Required FILE_UPLOAD section {} is incomplete", sectionId);
                        return false;
                    }
                    break;
                case DATE_TIME:
                    if (!((DateTimeSection) section).hasTimestamp()) {
                        logger.debug("Required DATE_TIME section {} is incomplete", sectionId);
                        return false;
                    }
                    break;
                case IMAGE:
                    if (!((ImageSection) section).hasImageUrl()) {
                        logger.debug("Required IMAGE section {} is incomplete", sectionId);
                        return false;
                    }
                    break;
                default:
                    logger.error("Unknown section type: {} for section: {}", section.getType(),
                            sectionId);
                    return false;
            }
        }
        logger.info("Form response validation complete - formId: {}, eventId: {}, status: complete",
                formResponse.getFormId(), formResponse.getEventId());
        return true;
    }

    /**
     * Copies a temporary form response to the submitted collection and deletes the temporary
     * version
     *
     * @param formId The form ID
     * @param eventId The event ID
     * @param formResponseId The form response ID
     * @throws RuntimeException if there's an error during the copy operation
     */
    public static void copyTempFormResponseToSubmitted(String formId, String eventId,
            String formResponseId) {
        logger.info(
                "Starting copy of temporary form response to submitted - formId: {}, eventId: {}, formResponseId: {}",
                formId, eventId, formResponseId);

        if (formId == null || eventId == null || formResponseId == null) {
            logger.error(
                    "Invalid parameters for copyTempFormResponseToSubmitted - formId: {}, eventId: {}, formResponseId: {}",
                    formId, eventId, formResponseId);
            throw new IllegalArgumentException(
                    "formId, eventId, and formResponseId must not be null");
        }

        try {
            // Step 1: Get the temporary form response
            logger.debug("Retrieving temporary form response");
            FormResponse tempFormResponse =
                    FormsRepository.getTempFormResponseById(formId, eventId, formResponseId);
            logger.debug("Retrieved temporary form response with {} sections",
                    tempFormResponse.getResponseSectionsOrder() != null
                            ? tempFormResponse.getResponseSectionsOrder().size()
                            : 0);

            // Step 2: Set submission time for the final submission
            tempFormResponse.setSubmissionTime(com.google.cloud.Timestamp.now());
            logger.debug("Set submission timestamp");

            // Step 3: Save to submitted collection
            logger.debug("Saving to submitted collection");
            FormsRepository.saveSubmittedFormResponse(tempFormResponse);
            logger.info("Successfully saved form response to submitted collection");

            // Step 4: Delete from temporary collection
            logger.debug("Deleting from temporary collection");
            FormsRepository.deleteTempFormResponse(formId, eventId, formResponseId);
            logger.info("Successfully deleted temporary form response");

            logger.info(
                    "Successfully completed copy operation - formId: {}, eventId: {}, formResponseId: {}",
                    formId, eventId, formResponseId);
        } catch (Exception e) {
            logger.error(
                    "Error copying temporary form response to submitted - formId: {}, eventId: {}, formResponseId: {}",
                    formId, eventId, formResponseId, e);
            throw new RuntimeException(
                    "Failed to copy temporary form response to submitted - formId: " + formId
                            + ", eventId: " + eventId + ", formResponseId: " + formResponseId,
                    e);
        }
    }
}
