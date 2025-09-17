package com.functions.fulfilment.handlers;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.fulfilment.models.requests.GetFulfilmentEntityInfoRequest;
import com.functions.fulfilment.models.responses.GetFulfilmentEntityInfoResponse;
import com.functions.fulfilment.services.FulfilmentService;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;

public class GetFulfilmentEntityInfoHandler implements Handler<GetFulfilmentEntityInfoRequest, GetFulfilmentEntityInfoResponse> {
    private static final Logger logger = LoggerFactory.getLogger(GetFulfilmentEntityInfoHandler.class);

    @Override
    public GetFulfilmentEntityInfoRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), GetFulfilmentEntityInfoRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse GetFulfilmentEntityInfoRequest", e);
        }
    }

    @Override
    public GetFulfilmentEntityInfoResponse handle(GetFulfilmentEntityInfoRequest request) {
        Optional<GetFulfilmentEntityInfoResponse> maybeResponse = FulfilmentService.getFulfilmentEntityInfo(
                request.fulfilmentSessionId(), request.fulfilmentEntityId());

        if (maybeResponse.isPresent()) {
            logger.info("Fulfilment entity info retrieved successfully for session: {} and entity Id: {}, {}",
                    request.fulfilmentSessionId(), request.fulfilmentEntityId(), maybeResponse.get().toString());
            return maybeResponse.get();
        } else {
            logger.error("No fulfilment entity info found for session: {}, entity Id: {}", 
                    request.fulfilmentSessionId(), request.fulfilmentEntityId());
            throw new RuntimeException("No fulfilment entity info found for session: " + request.fulfilmentSessionId()
                    + " and entity Id: " + request.fulfilmentEntityId());
        }
    }
}
