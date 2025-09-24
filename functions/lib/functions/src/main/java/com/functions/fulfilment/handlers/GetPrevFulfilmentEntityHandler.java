package com.functions.fulfilment.handlers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.fulfilment.models.requests.GetPrevFulfilmentEntityRequest;
import com.functions.fulfilment.models.responses.GetPrevFulfilmentEntityResponse;
import com.functions.fulfilment.services.FulfilmentService;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Optional;

public class GetPrevFulfilmentEntityHandler
        implements Handler<GetPrevFulfilmentEntityRequest, GetPrevFulfilmentEntityResponse> {
    private static final Logger logger =
            LoggerFactory.getLogger(GetPrevFulfilmentEntityHandler.class);

    @Override
    public GetPrevFulfilmentEntityRequest parse(UnifiedRequest data) {
        logger.debug("Parsing GetPrevFulfilmentEntityRequest");
        try {
            GetPrevFulfilmentEntityRequest request = JavaUtils.objectMapper.treeToValue(data.data(),
                    GetPrevFulfilmentEntityRequest.class);
            logger.debug("Successfully parsed request - sessionId: {}, currentEntityId: {}",
                    request.fulfilmentSessionId(), request.currentFulfilmentEntityId());
            return request;
        } catch (JsonProcessingException e) {
            logger.error("Failed to parse GetPrevFulfilmentEntityRequest", e);
            throw new RuntimeException("Failed to parse GetPrevFulfilmentEntityRequest", e);
        }
    }

    @Override
    public GetPrevFulfilmentEntityResponse handle(GetPrevFulfilmentEntityRequest request) {
        logger.info("Getting previous fulfilment entity - sessionId: {}, currentEntityId: {}",
                request.fulfilmentSessionId(), request.currentFulfilmentEntityId());

        if (request.fulfilmentSessionId() == null || request.currentFulfilmentEntityId() == null) {
            logger.error("Invalid parameters - sessionId: {}, currentEntityId: {}",
                    request.fulfilmentSessionId(), request.currentFulfilmentEntityId());
            throw new IllegalArgumentException("Both sessionId and currentEntityId are required");
        }

        logger.debug("Calling FulfilmentService to get previous entity");
        Optional<GetPrevFulfilmentEntityResponse> maybeResponse =
                FulfilmentService.getPrevFulfilmentEntityByCurrentId(request.fulfilmentSessionId(),
                        request.currentFulfilmentEntityId());

        if (maybeResponse.isPresent()) {
            GetPrevFulfilmentEntityResponse response = maybeResponse.get();
            logger.info(
                    "Successfully retrieved previous fulfilment entity - sessionId: {}, currentEntityId: {}, prevEntityId: {}",
                    request.fulfilmentSessionId(), request.currentFulfilmentEntityId(),
                    response.fulfilmentEntityId());
            return response;
        } else {
            logger.info(
                    "No previous fulfilment entities available - sessionId: {}, currentEntityId: {} (at beginning of workflow)",
                    request.fulfilmentSessionId(), request.currentFulfilmentEntityId());
            throw new RuntimeException("No previous fulfilment entities found for session: "
                    + request.fulfilmentSessionId());
        }
    }
}
