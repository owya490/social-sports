package com.functions.fulfilment.handlers;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.fulfilment.models.requests.GetFulfilmentSessionInfoRequest;
import com.functions.fulfilment.models.responses.GetFulfilmentSessionInfoResponse;
import com.functions.fulfilment.services.FulfilmentService;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;

public class GetFulfilmentSessionInfoHandler implements Handler<GetFulfilmentSessionInfoRequest, GetFulfilmentSessionInfoResponse> {
    private static final Logger logger = LoggerFactory.getLogger(GetFulfilmentSessionInfoHandler.class);

    @Override
    public GetFulfilmentSessionInfoRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), GetFulfilmentSessionInfoRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse GetFulfilmentSessionInfoRequest", e);
        }
    }

    @Override
    public GetFulfilmentSessionInfoResponse handle(GetFulfilmentSessionInfoRequest request) {
        if (request == null || request.fulfilmentSessionId() == null) {
            throw new IllegalArgumentException("fulfilmentSessionId is required");
        }

        Optional<GetFulfilmentSessionInfoResponse> maybeResponse = FulfilmentService.getFulfilmentSessionInfo(
                request.fulfilmentSessionId(), request.currentFulfilmentEntityId());

        if (maybeResponse.isPresent()) {
            GetFulfilmentSessionInfoResponse responseData = maybeResponse.get();
            String indexInfo = responseData.currentEntityIndex() != null
                    ? " at index " + responseData.currentEntityIndex()
                    : " (no current index specified)";
            logger.info("Fulfilment session info retrieved successfully for session: {}, found {} entity types{}",
                    request.fulfilmentSessionId(), responseData.fulfilmentEntityTypes().size(), indexInfo);
            return responseData;
        } else {
            logger.error("No fulfilment session found for ID: {}", request.fulfilmentSessionId());
            throw new RuntimeException("No fulfilment session found for ID: " + request.fulfilmentSessionId());
        }
    }
}
