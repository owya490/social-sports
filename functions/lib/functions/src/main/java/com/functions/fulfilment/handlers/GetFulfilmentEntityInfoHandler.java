package com.functions.fulfilment.handlers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.fulfilment.models.requests.GetFulfilmentEntityInfoRequest;
import com.functions.fulfilment.models.responses.GetFulfilmentEntityInfoResponse;
import com.functions.fulfilment.services.FulfilmentService;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

public class GetFulfilmentEntityInfoHandler implements Handler<GetFulfilmentEntityInfoRequest, GetFulfilmentEntityInfoResponse> {
    private static final Logger logger = LoggerFactory.getLogger(GetFulfilmentEntityInfoHandler.class);

    @Override
    public GetFulfilmentEntityInfoRequest parse(UnifiedRequest data) {
        logger.debug("Parsing GetFulfilmentEntityInfoRequest from UnifiedRequest: {}", data.toString());
        try {
            GetFulfilmentEntityInfoRequest parsed = JavaUtils.objectMapper.treeToValue(data.data(), GetFulfilmentEntityInfoRequest.class);
            logger.info("Successfully parsed GetFulfilmentEntityInfoRequest: sessionId={}, entityId={}, parsed={}",
                    parsed.fulfilmentSessionId(), parsed.fulfilmentEntityId(), parsed);
            return parsed;
        } catch (JsonProcessingException e) {
            logger.error("Failed to parse GetFulfilmentEntityInfoRequest: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to parse GetFulfilmentEntityInfoRequest", e);
        }
    }

    @Override
    public GetFulfilmentEntityInfoResponse handle(GetFulfilmentEntityInfoRequest request) {
        logger.info("Handling GetFulfilmentEntityInfoRequest: sessionId={}, entityId={}, request={}",
                request.fulfilmentSessionId(), request.fulfilmentEntityId(), request);

        logger.debug("Calling FulfilmentService to get entity info");
        Optional<GetFulfilmentEntityInfoResponse> maybeResponse = FulfilmentService.getFulfilmentEntityInfo(
                request.fulfilmentSessionId(), request.fulfilmentEntityId());

        if (maybeResponse.isPresent()) {
            GetFulfilmentEntityInfoResponse response = maybeResponse.get();
            logger.info("Fulfilment entity info retrieved successfully: sessionId={}, entityId={}, response={}",
                    request.fulfilmentSessionId(), request.fulfilmentEntityId(), response);
            return response;
        } else {
            logger.error("No fulfilment entity info found: sessionId={}, entityId={}, request={}",
                    request.fulfilmentSessionId(), request.fulfilmentEntityId(), request);
            throw new RuntimeException("No fulfilment entity info found for session: " + request.fulfilmentSessionId()
                    + " and entity Id: " + request.fulfilmentEntityId());
        }
    }
}
