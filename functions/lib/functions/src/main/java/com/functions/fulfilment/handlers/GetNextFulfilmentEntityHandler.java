package com.functions.fulfilment.handlers;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.fulfilment.models.requests.GetNextFulfilmentEntityRequest;
import com.functions.fulfilment.models.responses.GetNextFulfilmentEntityResponse;
import com.functions.fulfilment.services.FulfilmentService;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;

public class GetNextFulfilmentEntityHandler implements Handler<GetNextFulfilmentEntityRequest, GetNextFulfilmentEntityResponse> {
    private static final Logger logger = LoggerFactory.getLogger(GetNextFulfilmentEntityHandler.class);

    @Override
    public GetNextFulfilmentEntityRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), GetNextFulfilmentEntityRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse GetNextFulfilmentEntityRequest", e);
        }
    }

    @Override
    public GetNextFulfilmentEntityResponse handle(GetNextFulfilmentEntityRequest request) {
        if (request == null || request.fulfilmentSessionId() == null || request.currentFulfilmentEntityId() == null) {
            throw new IllegalArgumentException("fulfilmentSessionId and currentFulfilmentEntityId are required");
        }

        Optional<GetNextFulfilmentEntityResponse> maybeResponse = FulfilmentService.getNextFulfilmentEntityByCurrentId(
                request.fulfilmentSessionId(), request.currentFulfilmentEntityId());

        if (maybeResponse.isPresent()) {
            logger.info("Next fulfilment entity retrieved successfully for session: {}",
                    request.fulfilmentSessionId());
            return maybeResponse.get();
        } else {
            logger.info("No more fulfilment entities found for session: {}", request.fulfilmentSessionId());
            throw new RuntimeException("No more fulfilment entities found for session: " + request.fulfilmentSessionId());
        }
    }
}
