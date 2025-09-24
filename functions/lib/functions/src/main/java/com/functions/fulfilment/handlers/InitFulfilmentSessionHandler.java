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
        logger.debug("Parsing InitCheckoutFulfilmentSessionRequest from UnifiedRequest, data: {}", data.toString());
        try {
            InitCheckoutFulfilmentSessionRequest parsed = JavaUtils.objectMapper.treeToValue(data.data(), InitCheckoutFulfilmentSessionRequest.class);
            logger.info("Successfully parsed InitCheckoutFulfilmentSessionRequest: eventId={}, numTickets={}, parsed: {}",
                    parsed.eventId(), parsed.numTickets(), parsed);
            return parsed;
        } catch (JsonProcessingException e) {
            logger.error("Failed to parse InitCheckoutFulfilmentSessionRequest: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to parse InitCheckoutFulfilmentSessionRequest", e);
        }
    }

    @Override
    public InitCheckoutFulfilmentSessionResponse handle(InitCheckoutFulfilmentSessionRequest request) {
        logger.info("Handling InitCheckoutFulfilmentSessionRequest: eventId={}, numTickets={}, request: {}",
                request.eventId(), request.numTickets(), request);

        logger.debug("Calling FulfilmentService to initialize checkout session");
        Optional<String> maybeFulfilmentSessionId = FulfilmentService.initCheckoutFulfilmentSession(
                request.eventId(), request.numTickets());

        if (maybeFulfilmentSessionId.isPresent()) {
            String sessionId = maybeFulfilmentSessionId.get();
            logger.info("Fulfilment session successfully created: sessionId={}, eventId={}, numTickets={}, request: {}",
                    sessionId, request.eventId(), request.numTickets(), request);
            return new InitCheckoutFulfilmentSessionResponse(sessionId);
        } else {
            logger.error("Failed to create fulfilment session for eventId: {}, numTickets: {}",
                    request.eventId(), request.numTickets());
            throw new RuntimeException("Failed to create fulfilment session for event ID: " + request.eventId());
        }
    }
}
