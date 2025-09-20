package com.functions.fulfilment.handlers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.fulfilment.models.requests.InitCheckoutFulfilmentSessionRequest;
import com.functions.fulfilment.models.responses.InitCheckoutFulfilmentSessionResponse;
import com.functions.fulfilment.services.FulfilmentService;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

public class InitFulfilmentSessionHandler implements Handler<InitCheckoutFulfilmentSessionRequest, InitCheckoutFulfilmentSessionResponse> {
    private static final Logger logger = LoggerFactory.getLogger(InitFulfilmentSessionHandler.class);

    @Override
    public InitCheckoutFulfilmentSessionRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), InitCheckoutFulfilmentSessionRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse InitCheckoutFulfilmentSessionRequest", e);
        }
    }

    @Override
    public InitCheckoutFulfilmentSessionResponse handle(InitCheckoutFulfilmentSessionRequest request) {
        Optional<String> maybeFulfilmentSessionId = FulfilmentService.initCheckoutFulfilmentSession(
                request.eventId(), request.numTickets());

        if (maybeFulfilmentSessionId.isPresent()) {
            logger.info("[InitFulfilmentSessionHandler] Fulfilment session successfully created: {}",
                    maybeFulfilmentSessionId.get());
            return new InitCheckoutFulfilmentSessionResponse(maybeFulfilmentSessionId.get());
        } else {
            logger.error("Failed to create fulfilment session for event ID: {}", request.eventId());
            throw new RuntimeException("Failed to create fulfilment session for event ID: " + request.eventId());
        }
    }
}
