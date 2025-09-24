package com.functions.fulfilment.handlers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.fulfilment.models.requests.UpdateFulfilmentEntityWithFormResponseIdRequest;
import com.functions.fulfilment.services.FulfilmentService;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class UpdateFulfilmentEntityWithFormResponseIdHandler
        implements Handler<UpdateFulfilmentEntityWithFormResponseIdRequest, String> {
    private static final Logger logger =
            LoggerFactory.getLogger(UpdateFulfilmentEntityWithFormResponseIdHandler.class);

    @Override
    public UpdateFulfilmentEntityWithFormResponseIdRequest parse(UnifiedRequest data) {
        logger.debug("Parsing UpdateFulfilmentEntityWithFormResponseIdRequest");
        try {
            UpdateFulfilmentEntityWithFormResponseIdRequest request =
                    JavaUtils.objectMapper.treeToValue(data.data(),
                            UpdateFulfilmentEntityWithFormResponseIdRequest.class);
            logger.debug(
                    "Successfully parsed request - sessionId: {}, entityId: {}, formResponseId: {}",
                    request.fulfilmentSessionId(), request.fulfilmentEntityId(),
                    request.formResponseId());
            return request;
        } catch (JsonProcessingException e) {
            logger.error("Failed to parse UpdateFulfilmentEntityWithFormResponseIdRequest", e);
            throw new RuntimeException(
                    "Failed to parse UpdateFulfilmentEntityWithFormResponseIdRequest", e);
        }
    }

    @Override
    public String handle(UpdateFulfilmentEntityWithFormResponseIdRequest request) {
        logger.info(
                "Updating fulfilment entity with form response - sessionId: {}, entityId: {}, formResponseId: {}",
                request.fulfilmentSessionId(), request.fulfilmentEntityId(),
                request.formResponseId());

        if (request.fulfilmentSessionId() == null || request.fulfilmentEntityId() == null
                || request.formResponseId() == null) {
            logger.error("Invalid parameters - sessionId: {}, entityId: {}, formResponseId: {}",
                    request.fulfilmentSessionId(), request.fulfilmentEntityId(),
                    request.formResponseId());
            throw new IllegalArgumentException(
                    "All parameters (sessionId, entityId, formResponseId) are required");
        }

        logger.debug("Calling FulfilmentService to update entity");
        boolean success = FulfilmentService.updateFulfilmentEntityWithFormResponseId(
                request.fulfilmentSessionId(), request.fulfilmentEntityId(),
                request.formResponseId());

        if (success) {
            logger.info(
                    "Successfully updated fulfilment entity - sessionId: {}, entityId: {}, formResponseId: {}",
                    request.fulfilmentSessionId(), request.fulfilmentEntityId(),
                    request.formResponseId());
            return "Fulfilment entity updated successfully.";
        } else {
            logger.error(
                    "Failed to update fulfilment entity - sessionId: {}, entityId: {}, formResponseId: {}",
                    request.fulfilmentSessionId(), request.fulfilmentEntityId(),
                    request.formResponseId());
            throw new RuntimeException(
                    "Error updating fulfilment entity " + request.fulfilmentEntityId()
                            + " for session: " + request.fulfilmentSessionId()
                            + " with form response ID: " + request.formResponseId());
        }
    }
}
