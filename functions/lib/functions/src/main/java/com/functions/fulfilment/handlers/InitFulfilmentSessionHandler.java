package com.functions.fulfilment.handlers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.fulfilment.models.requests.InitCheckoutFulfilmentSessionRequest;
import com.functions.fulfilment.models.responses.InitCheckoutFulfilmentSessionResponse;
import com.functions.fulfilment.services.FulfilmentService;
import com.functions.global.models.Handler;
import com.functions.global.models.AuthContext;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;

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
    public InitCheckoutFulfilmentSessionResponse handle(InitCheckoutFulfilmentSessionRequest request, AuthContext authContext) throws Exception {
        logger.info("Handling init fulfilment session request for event ID: {}, numTickets: {}, request: {}",
                request.eventId(), request.numTickets(), request);

        String fulfilmentSessionId = FulfilmentService.initFulfilmentSession(
                request.eventId(), request.numTickets());
        String fulfilmentSessionSecret = FulfilmentService.getFulfilmentSessionById(fulfilmentSessionId)
                .map(session -> session.getSessionSecret())
                .orElseThrow(() -> new RuntimeException("Failed to retrieve fulfilment session secret"));

        logger.info("[InitFulfilmentSessionHandler] Fulfilment session successfully created: {}",
                fulfilmentSessionId);
        return new InitCheckoutFulfilmentSessionResponse(fulfilmentSessionId, fulfilmentSessionSecret);
    }
}
