package com.functions.forms.services;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.repositories.EventsRepository;
import com.functions.forms.models.DateTimeSection;
import com.functions.forms.models.DropdownSelectSection;
import com.functions.forms.models.FileUploadSection;
import com.functions.forms.models.FormResponse;
import com.functions.forms.models.FormSection;
import com.functions.forms.models.ImageSection;
import com.functions.forms.models.MultipleChoiceSection;
import com.functions.forms.models.TextSection;
import com.functions.forms.models.TickboxSection;
import com.functions.forms.repositories.FormsRepository;
import com.google.cloud.firestore.Transaction;

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
            logger.error("Error trying to get form ID for event ID {}", eventId, e);
            throw new RuntimeException("Failed to retrieve form ID for event ID: " + eventId, e);
        }
    }

    public static boolean isFormResponseComplete(FormResponse formResponse) {
        if (formResponse == null || formResponse.getResponseMap() == null) {
            logger.info("Form response is incomplete because it is null or has no response map");
            return false;
        }
        logger.debug("Checking form response completeness. formId={}, eventId={}, formResponseId={}, sectionCount={}",
                formResponse.getFormId(), formResponse.getEventId(), formResponse.getFormResponseId(),
                formResponse.getResponseSectionsOrder().size());
        // Check if all required sections have answers which are non-empty
        for (String sectionId : formResponse.getResponseSectionsOrder()) {
            FormSection section = formResponse.getResponseMap().get(sectionId);
            if (section == null) {
                logger.error("Missing section in form response map. formId={}, eventId={}, formResponseId={}, sectionId={}",
                        formResponse.getFormId(), formResponse.getEventId(), formResponse.getFormResponseId(), sectionId);
                return false;
            }

            if (!section.isRequired()) {
                logger.debug("Skipping non-required form section. formId={}, eventId={}, formResponseId={}, sectionId={}, sectionType={}",
                        formResponse.getFormId(), formResponse.getEventId(), formResponse.getFormResponseId(),
                        sectionId, section.getType());
                continue;
            }

            boolean hasAnswer = switch (section.getType()) {
                case TEXT -> ((TextSection) section).hasAnswer();
                case MULTIPLE_CHOICE -> ((MultipleChoiceSection) section).hasAnswer();
                case DROPDOWN_SELECT -> ((DropdownSelectSection) section).hasAnswer();
                case TICKBOX -> ((TickboxSection) section).hasAnswer();
                case FILE_UPLOAD -> ((FileUploadSection) section).hasFileUrl();
                case DATE_TIME -> ((DateTimeSection) section).hasTimestamp();
                case IMAGE -> ((ImageSection) section).hasImageUrl();
                // No default! If you add a new enum value, this won't compile.
            };

            if (!hasAnswer) {
                return false;
            }
        }
        logger.info("Form response is complete. formId={}, eventId={}, formResponseId={}",
                formResponse.getFormId(), formResponse.getEventId(), formResponse.getFormResponseId());
        return true;
    }

    /**
     * Copies a temporary form response to the submitted collection and deletes the
     * temporary
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
            logger.info(
                    "Successfully saved form response to submitted collection using {} - formId: {}, eventId: {}, formResponseId: {}",
                    transaction.isPresent() ? "transaction" : "regular operation", formId, eventId, formResponseId);

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
                    "Error copying temporary form response to submitted using {} - formId: {}, eventId: {}, formResponseId: {}",
                    transaction.isPresent() ? "transaction" : "regular operation", formId, eventId,
                    formResponseId, e);
            throw new RuntimeException(
                    "Failed to copy temporary form response to submitted - formId: "
                            + formId + ", eventId: " + eventId + ", formResponseId: " + formResponseId,
                    e);
        }
    }

    /**
     * Copies a temporary form response to the submitted collection using pre-read
     * data and deletes the temporary version.
     * This method is designed for use within transactions where all reads must
     * occur before writes.
     *
     * @param tempFormResponse The pre-read temporary form response
     * @param transaction      Optional transaction to use for atomic operations
     * @throws RuntimeException if there's an error during the copy operation
     */
    public static void copyTempFormResponseToSubmittedWithData(FormResponse tempFormResponse,
            Optional<Transaction> transaction) {
        try {
            String logPrefix = transaction.isPresent() ? "transactional " : "";
            logger.info(
                    "Starting {}copy of pre-read temporary form response to submitted - formId: {}, eventId: {}, formResponseId: {}",
                    logPrefix, tempFormResponse.getFormId(), tempFormResponse.getEventId(),
                    tempFormResponse.getFormResponseId());

            // Step 1: Set submission time for the final submission
            tempFormResponse.setSubmissionTime(com.google.cloud.Timestamp.now());

            // Step 2: Save to submitted collection
            FormsRepository.saveSubmittedFormResponse(tempFormResponse, transaction);
            logger.info(
                    "Successfully saved pre-read form response to submitted collection using {} - formId: {}, eventId: {}, formResponseId: {}",
                    transaction.isPresent() ? "transaction" : "regular operation",
                    tempFormResponse.getFormId(), tempFormResponse.getEventId(), tempFormResponse.getFormResponseId());

            // Step 3: Delete from temporary collection
            FormsRepository.deleteTempFormResponse(tempFormResponse.getFormId(), tempFormResponse.getEventId(),
                    tempFormResponse.getFormResponseId(), transaction);
            logger.info("Successfully deleted temporary form response using {}",
                    transaction.isPresent() ? "transaction" : "regular operation");

            logger.info(
                    "Successfully copied pre-read temporary form response to submitted using {} - formId: {}, eventId: {}, formResponseId: {}",
                    transaction.isPresent() ? "transaction" : "regular operation",
                    tempFormResponse.getFormId(), tempFormResponse.getEventId(), tempFormResponse.getFormResponseId());
        } catch (Exception e) {
            logger.error(
                    "Error copying pre-read temporary form response to submitted using {} - formId: {}, eventId: {}, formResponseId: {}",
                    transaction.isPresent() ? "transaction" : "regular operation",
                    tempFormResponse.getFormId(), tempFormResponse.getEventId(), tempFormResponse.getFormResponseId(),
                    e);
            throw new RuntimeException(
                    "Failed to copy pre-read temporary form response to submitted - formId: "
                            + tempFormResponse.getFormId() + ", eventId: " + tempFormResponse.getEventId()
                            + ", formResponseId: " + tempFormResponse.getFormResponseId(),
                    e);
        }
    }
}
