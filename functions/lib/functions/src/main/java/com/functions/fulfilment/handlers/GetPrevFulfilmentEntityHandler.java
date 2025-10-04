package com.functions.fulfilment.handlers;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.fulfilment.models.requests.GetPrevFulfilmentEntityRequest;
import com.functions.fulfilment.models.responses.GetPrevFulfilmentEntityResponse;
import com.functions.fulfilment.services.FulfilmentService;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;

public class GetPrevFulfilmentEntityHandler implements Handler<GetPrevFulfilmentEntityRequest, GetPrevFulfilmentEntityResponse> {
    private static final Logger logger = LoggerFactory.getLogger(GetPrevFulfilmentEntityHandler.class);

    @Override
    public GetPrevFulfilmentEntityRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), GetPrevFulfilmentEntityRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse GetPrevFulfilmentEntityRequest", e);
        }
    }

    @Override
    public GetPrevFulfilmentEntityResponse handle(GetPrevFulfilmentEntityRequest request) {
        Optional<GetPrevFulfilmentEntityResponse> maybeResponse = FulfilmentService.getPrevFulfilmentEntityByCurrentId(
                request.fulfilmentSessionId(), request.currentFulfilmentEntityId());

        if (maybeResponse.isPresent()) {
            logger.info("Previous fulfilment entity retrieved successfully for session: {}",
                    request.fulfilmentSessionId());
            return maybeResponse.get();
        } else {
            logger.info("No previous fulfilment entities found for session: {}", request.fulfilmentSessionId());
            throw new RuntimeException("No previous fulfilment entities found for session: " + request.fulfilmentSessionId());
        }
    }
}
