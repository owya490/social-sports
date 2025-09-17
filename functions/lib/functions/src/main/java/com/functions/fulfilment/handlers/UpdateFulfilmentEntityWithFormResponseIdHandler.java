package com.functions.fulfilment.handlers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.fulfilment.models.requests.UpdateFulfilmentEntityWithFormResponseIdRequest;
import com.functions.fulfilment.services.FulfilmentService;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;

public class UpdateFulfilmentEntityWithFormResponseIdHandler implements Handler<UpdateFulfilmentEntityWithFormResponseIdRequest, String> {
    private static final Logger logger = LoggerFactory.getLogger(UpdateFulfilmentEntityWithFormResponseIdHandler.class);

    @Override
    public UpdateFulfilmentEntityWithFormResponseIdRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), UpdateFulfilmentEntityWithFormResponseIdRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse UpdateFulfilmentEntityWithFormResponseIdRequest", e);
        }
    }

    @Override
    public String handle(UpdateFulfilmentEntityWithFormResponseIdRequest request) {
        if (request == null || request.fulfilmentSessionId() == null || 
            request.fulfilmentEntityId() == null || request.formResponseId() == null) {
            throw new IllegalArgumentException("fulfilmentSessionId, fulfilmentEntityId, and formResponseId are required");
        }

        boolean success = FulfilmentService.updateFulfilmentEntityWithFormResponseId(
                request.fulfilmentSessionId(), request.fulfilmentEntityId(), request.formResponseId());

        if (success) {
            return "Fulfilment entity updated successfully.";
        } else {
            logger.error(
                    "Failed to update fulfilment entity with form response ID for session ID: {} and entity ID: {}",
                    request.fulfilmentSessionId(), request.fulfilmentEntityId());
            throw new RuntimeException("Error updating fulfilment entity " + request.fulfilmentEntityId()
                    + " for session: " + request.fulfilmentSessionId()
                    + " with form response ID: " + request.formResponseId());
        }
    }
}
