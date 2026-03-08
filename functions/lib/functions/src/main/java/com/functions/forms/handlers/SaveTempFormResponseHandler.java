package com.functions.forms.handlers;

import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.forms.models.FormResponse;
import com.functions.forms.models.requests.SaveTempFormResponseRequest;
import com.functions.forms.models.responses.SaveTempFormResponseResponse;
import com.functions.forms.repositories.FormsRepository;
import com.functions.forms.services.FormsUtils;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;

public class SaveTempFormResponseHandler implements Handler<SaveTempFormResponseRequest, SaveTempFormResponseResponse> {
    private static final Logger logger = LoggerFactory.getLogger(SaveTempFormResponseHandler.class);

    @Override
    public SaveTempFormResponseRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), SaveTempFormResponseRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse SaveTempFormResponseRequest", e);
        }
    }

    @Override
    public SaveTempFormResponseResponse handle(SaveTempFormResponseRequest request) {
        if (request == null || request.getFormResponse() == null) {
            throw new IllegalArgumentException("formResponse is required");
        }

        logger.info("Handling save form response request for formId: {}, eventId: {}",
                request.getFormResponse().getFormId(), request.getFormResponse().getEventId());

        Optional<String> maybeFormResponseId = saveTempFormResponse(request.getFormResponse());

        if (maybeFormResponseId.isPresent()) {
            String formResponseId = maybeFormResponseId.get();
            logger.info("Temporary form response saved successfully with ID: {}", formResponseId);
            return new SaveTempFormResponseResponse(formResponseId);
        } else {
            logger.error("Failed to save form response for formId: {}, eventId: {}",
                    request.getFormResponse().getFormId(), request.getFormResponse().getEventId());
            throw new RuntimeException("Failed to save form response");
        }
    }

    private static Optional<String> saveTempFormResponse(FormResponse formResponse) {
        if (!FormsUtils.isFormResponseComplete(formResponse)) {
            logger.error(
                    "[FormsUtils] Trying to save incomplete temp form response for formId: {}, eventId: {}, formResponse: {}",
                    formResponse.getFormId(), formResponse.getEventId(), formResponse);
            throw new IllegalArgumentException("Form response is incomplete. All required fields must be filled.");
        }

        try {
            logger.info("Saving temp form response for formId: {}, eventId: {}", formResponse.getFormId(),
                    formResponse.getEventId());

            String formResponseId = formResponse.getFormResponseId();
            if (formResponseId != null && formResponseId.contains("/")) {
                throw new IllegalArgumentException("formResponseId must not contain '/'");
            }
            if (formResponseId == null || formResponseId.isEmpty()) {
                formResponseId = UUID.randomUUID().toString();
                formResponse.setFormResponseId(formResponseId);
            }

            // Clear the submission time for temp form responses
            formResponse.setSubmissionTime(null);

            // Save to temp collection
            FormsRepository.saveTempFormResponse(formResponse);

            logger.info("Successfully saved temporary form response with ID: {}", formResponseId);
            return Optional.of(formResponseId);
        } catch (IllegalArgumentException e) {
            // Re-throw validation errors so they propagate to GlobalAppController as 400s
            throw e;
        } catch (Exception e) {
            logger.error("[FormsUtils] Error saving temporary form response: {} - {}",
                    formResponse, e.getMessage());
            return Optional.empty();
        }
    }
}
