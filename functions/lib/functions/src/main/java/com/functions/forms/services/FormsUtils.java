package com.functions.forms.services;

import com.functions.events.repositories.EventsRepository;
import com.functions.forms.models.*;
import com.functions.forms.repositories.FormsRepository;
import com.google.cloud.firestore.Transaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

public class FormsUtils {
    private static final Logger logger = LoggerFactory.getLogger(FormsUtils.class);

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
            logger.error("Error trying to get form ID for event ID {}: {}", eventId,
                    e.getMessage());
            throw new RuntimeException(
                    "[FormsUtils] Failed to retrieve form ID for event ID: " + eventId, e);
        }
    }


    public static boolean isFormResponseComplete(FormResponse formResponse) {
        logger.info("[FormsUtils] Checking if form response is complete: {}", formResponse);
        if (formResponse == null || formResponse.getResponseMap() == null) {
            logger.info("[FormsUtils] Form response is null or has no response map: {}",
                    formResponse);
            return false;
        }
        // Check if all required sections have answers which are non-empty
        for (String sectionId : formResponse.getResponseSectionsOrder()) {
            FormSection section = formResponse.getResponseMap().get(sectionId);
            logger.info("[FormsUtils] Checking sectionId: {}, section: {}", sectionId, section);
            if (section == null) {
                logger.error("[FormsUtils] Missing section in response map: {}, returning false",
                        sectionId);
                return false;
            }

            if (!section.isRequired()) {
                logger.info("[FormsUtils] Section {} is not required, skipping: {}", sectionId,
                        section);
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
                case IMAGE:
                    if (!((ImageSection) section).hasImageUrl()) {
                        return false;
                    }
                    break;
                default:
                    logger.error("[FormsUtils] Unknown section type: {}", section.getType());
                    return false;
            }
        }
        logger.info("[FormsUtils] Form response is complete: {}", formResponse);
        return true;
    }

    /**
     * Copies a temporary form response to the submitted collection and deletes the temporary
     * version
     *
     * @param formId         The form ID
     * @param eventId        The event ID
     * @param formResponseId The form response ID
     * @param transaction    Optional transaction to use for atomic operations
     * @throws RuntimeException if there's an error during the copy operation
     */
    public static void copyTempFormResponseToSubmitted(String formId, String eventId,
                                                       String formResponseId, Optional<Transaction> transaction) {
        try {
            String logPrefix = transaction.isPresent() ? "transactional " : "";
            logger.info(
                    "Starting {}copy of temporary form response to submitted - formId: {}, eventId: {}, formResponseId: {}",
                    logPrefix, formId, eventId, formResponseId);

            // Step 1: Get the temporary form response
            FormResponse tempFormResponse = FormsRepository.getTempFormResponseById(formId, eventId,
                    formResponseId, transaction);

            // Step 2: Set submission time for the final submission
            tempFormResponse.setSubmissionTime(com.google.cloud.Timestamp.now());

            // Step 3: Save to submitted collection
            FormsRepository.saveSubmittedFormResponse(tempFormResponse, transaction);
            logger.info("Successfully saved form response to submitted collection using {}",
                    transaction.isPresent() ? "transaction" : "regular operation");

            // Step 4: Delete from temporary collection
            FormsRepository.deleteTempFormResponse(formId, eventId, formResponseId, transaction);
            logger.info("Successfully deleted temporary form response using {}",
                    transaction.isPresent() ? "transaction" : "regular operation");

            logger.info(
                    "Successfully copied temporary form response to submitted using {} - formId: {}, eventId: {}, formResponseId: {}",
                    transaction.isPresent() ? "transaction" : "regular operation", formId, eventId,
                    formResponseId);
        } catch (Exception e) {
            logger.error(
                    "[FormsUtils] Error copying temporary form response to submitted using {} - formId: {}, eventId: {}, formResponseId: {}: {}",
                    transaction.isPresent() ? "transaction" : "regular operation", formId, eventId,
                    formResponseId, e.getMessage());
            throw new RuntimeException(
                    "[FormsUtils] Failed to copy temporary form response to submitted - formId: "
                            + formId + ", eventId: " + eventId + ", formResponseId: "
                            + formResponseId,
                    e);
        }
    }
}
