package com.functions.forms.handlers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.forms.models.FormResponse;
import com.functions.forms.models.requests.SaveTempFormResponseRequest;
import com.functions.forms.models.responses.SaveTempFormResponseResponse;
import com.functions.forms.repositories.FormsRepository;
import com.functions.forms.services.FormsUtils;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Optional;
import java.util.UUID;


public class SaveTempFormResponseHandler
        implements Handler<SaveTempFormResponseRequest, SaveTempFormResponseResponse> {
    private static final Logger logger = LoggerFactory.getLogger(SaveTempFormResponseHandler.class);

    @Override
    public SaveTempFormResponseRequest parse(UnifiedRequest data) {
        logger.debug("Parsing SaveTempFormResponseRequest");
        try {
            SaveTempFormResponseRequest request = JavaUtils.objectMapper.treeToValue(data.data(),
                    SaveTempFormResponseRequest.class);
            logger.debug("Successfully parsed request - formId: {}, eventId: {}",
                    request.formResponse() != null ? request.formResponse().getFormId() : "null",
                    request.formResponse() != null ? request.formResponse().getEventId() : "null");
            return request;
        } catch (JsonProcessingException e) {
            logger.error("Failed to parse SaveTempFormResponseRequest", e);
            throw new RuntimeException("Failed to parse SaveTempFormResponseRequest", e);
        }
    }

    @Override
    public SaveTempFormResponseResponse handle(SaveTempFormResponseRequest request) {
        logger.info("Handling SaveTempFormResponseRequest");

        if (request == null) {
            logger.error("Request is null");
            throw new IllegalArgumentException("Request cannot be null");
        }

        if (request.formResponse() == null) {
            logger.error("FormResponse is null in request");
            throw new IllegalArgumentException("formResponse is required");
        }

        FormResponse formResponse = request.formResponse();
        logger.info("Processing temporary form response save - formId: {}, eventId: {}",
                formResponse.getFormId(), formResponse.getEventId());

        Optional<String> maybeFormResponseId = saveTempFormResponse(formResponse);

        if (maybeFormResponseId.isPresent()) {
            String formResponseId = maybeFormResponseId.get();
            logger.info(
                    "Temporary form response saved successfully - formId: {}, eventId: {}, formResponseId: {}",
                    formResponse.getFormId(), formResponse.getEventId(), formResponseId);
            return new SaveTempFormResponseResponse(formResponseId);
        } else {
            logger.error("Failed to save temporary form response - formId: {}, eventId: {}",
                    formResponse.getFormId(), formResponse.getEventId());
            throw new RuntimeException("Failed to save temporary form response for formId: "
                    + formResponse.getFormId() + ", eventId: " + formResponse.getEventId());
        }
    }

    /**
     * Saves a FormResponse as a temporary submission.
     *
     * @param formResponse The FormResponse to save
     * @return The generated formResponseId
     * @throws RuntimeException if there's an error saving the form response
     */
    private static Optional<String> saveTempFormResponse(FormResponse formResponse) {
        logger.debug("Validating and saving temporary form response - formId: {}, eventId: {}",
                formResponse.getFormId(), formResponse.getEventId());

        try {
            // Validate form response completeness
            if (!FormsUtils.isFormResponseComplete(formResponse)) {
                logger.warn("Attempting to save incomplete form response - formId: {}, eventId: {}",
                        formResponse.getFormId(), formResponse.getEventId());
                return Optional.empty();
            }

            logger.debug("Form response validation passed");

            // Generate a unique formResponseId if not already set
            String formResponseId = formResponse.getFormResponseId();
            if (formResponseId != null && formResponseId.contains("/")) {
                logger.error("Invalid formResponseId contains '/': {}", formResponseId);
                throw new IllegalArgumentException("formResponseId must not contain '/'");
            }

            if (formResponseId == null || formResponseId.isEmpty()) {
                formResponseId = UUID.randomUUID().toString();
                logger.debug("Generated new formResponseId: {}", formResponseId);
                formResponse.setFormResponseId(formResponseId);
            } else {
                logger.debug("Using existing formResponseId: {}", formResponseId);
            }

            // Clear the submission time for temp form responses
            formResponse.setSubmissionTime(null);
            logger.debug("Cleared submission time for temporary storage");

            // Save to repository
            FormsRepository.saveTempFormResponse(formResponse);

            logger.info(
                    "Successfully saved temporary form response - formId: {}, eventId: {}, formResponseId: {}",
                    formResponse.getFormId(), formResponse.getEventId(), formResponseId);
            return Optional.of(formResponseId);
        } catch (IllegalArgumentException e) {
            logger.error(
                    "Invalid argument for saving temporary form response - formId: {}, eventId: {}: {}",
                    formResponse.getFormId(), formResponse.getEventId(), e.getMessage());
            return Optional.empty();
        } catch (Exception e) {
            logger.error("Error saving temporary form response - formId: {}, eventId: {}: {}",
                    formResponse.getFormId(), formResponse.getEventId(), e.getMessage(), e);
            return Optional.empty();
        }
    }
}
