package com.functions.fulfilment.handlers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.fulfilment.models.requests.GetNextFulfilmentEntityRequest;
import com.functions.fulfilment.models.responses.GetNextFulfilmentEntityResponse;
import com.functions.fulfilment.services.FulfilmentService;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Optional;

public class GetNextFulfilmentEntityHandler
        implements Handler<GetNextFulfilmentEntityRequest, GetNextFulfilmentEntityResponse> {
    private static final Logger logger =
            LoggerFactory.getLogger(GetNextFulfilmentEntityHandler.class);

    @Override
    public GetNextFulfilmentEntityRequest parse(UnifiedRequest data) {
        logger.debug("Parsing GetNextFulfilmentEntityRequest");
        try {
            GetNextFulfilmentEntityRequest request = JavaUtils.objectMapper.treeToValue(data.data(),
                    GetNextFulfilmentEntityRequest.class);
            logger.debug("Successfully parsed request - sessionId: {}, currentEntityId: {}",
                    request.fulfilmentSessionId(), request.currentFulfilmentEntityId());
            return request;
        } catch (JsonProcessingException e) {
            logger.error("Failed to parse GetNextFulfilmentEntityRequest", e);
            throw new RuntimeException("Failed to parse GetNextFulfilmentEntityRequest", e);
        }
    }

    @Override
    public GetNextFulfilmentEntityResponse handle(GetNextFulfilmentEntityRequest request) {
        logger.info("Getting next fulfilment entity - sessionId: {}, currentEntityId: {}",
                request.fulfilmentSessionId(), request.currentFulfilmentEntityId());

        if (request.fulfilmentSessionId() == null || request.currentFulfilmentEntityId() == null) {
            logger.error("Invalid parameters - sessionId: {}, currentEntityId: {}",
                    request.fulfilmentSessionId(), request.currentFulfilmentEntityId());
            throw new IllegalArgumentException("Both sessionId and currentEntityId are required");
        }

        logger.debug("Calling FulfilmentService to get next entity");
        Optional<GetNextFulfilmentEntityResponse> maybeResponse =
                FulfilmentService.getNextFulfilmentEntityByCurrentId(request.fulfilmentSessionId(),
                        request.currentFulfilmentEntityId());

        if (maybeResponse.isPresent()) {
            GetNextFulfilmentEntityResponse response = maybeResponse.get();
            logger.info(
                    "Successfully retrieved next fulfilment entity - sessionId: {}, currentEntityId: {}, nextEntityId: {}",
                    request.fulfilmentSessionId(), request.currentFulfilmentEntityId(),
                    response.fulfilmentEntityId());
            return response;
        } else {
            logger.info(
                    "No more fulfilment entities available - sessionId: {}, currentEntityId: {} (workflow complete)",
                    request.fulfilmentSessionId(), request.currentFulfilmentEntityId());
            throw new RuntimeException("No more fulfilment entities found for session: "
                    + request.fulfilmentSessionId());
        }
    }
}
