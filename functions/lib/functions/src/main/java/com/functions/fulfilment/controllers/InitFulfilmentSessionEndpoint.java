package com.functions.fulfilment.controllers;

import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.fulfilment.models.FulfilmentEntityType;
import com.functions.fulfilment.models.requests.InitCheckoutFulfilmentSessionRequest;
import com.functions.fulfilment.models.responses.InitCheckoutFulfilmentSessionResponse;
import com.functions.fulfilment.services.FulfilmentService;
import com.functions.global.models.responses.ErrorResponse;
import com.functions.utils.JavaUtils;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

public class InitFulfilmentSessionEndpoint implements HttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(InitFulfilmentSessionEndpoint.class);

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        // Set CORS headers for all responses
        response.appendHeader("Access-Control-Allow-Origin", "*");
        response.appendHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.appendHeader("Access-Control-Max-Age", "3600"); // Cache preflight for 1 hour

        // Handle preflight (OPTIONS) requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatusCode(204); // No Content
            return;
        }

        if (!(request.getMethod().equalsIgnoreCase("POST"))) {
            response.setStatusCode(405); // Method Not Allowed
            response.appendHeader("Allow", "POST");
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(new ErrorResponse("The InitFulfilmentSessionEndpoint only supports POST requests.")));
            return;
        }

        InitCheckoutFulfilmentSessionRequest data;
        try {
            data = JavaUtils.objectMapper.readValue(request.getReader(), InitCheckoutFulfilmentSessionRequest.class);
        } catch (Exception e) {
            response.setStatusCode(400);
            logger.error("Could not parse input:", e);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(new ErrorResponse("Invalid request data: " + e.getMessage())));
            return;
        }

        Optional<String> maybeFulfilmentSessionId = FulfilmentService.initCheckoutFulfilmentSession(data.eventId(), data.numTickets(), toFulfilmentEntityTypes(data.fulfilmentEntityTypes()));

        if (maybeFulfilmentSessionId.isPresent()) {
            logger.info("Fulfilment session successfully created: {}", maybeFulfilmentSessionId.get());
            response.setStatusCode(200);
            response.getWriter().write(
                    JavaUtils.objectMapper.writeValueAsString(
                            new InitCheckoutFulfilmentSessionResponse(maybeFulfilmentSessionId.get())
                    )
            );
        } else {
            logger.error("Failed to create fulfilment session for event ID: {}", data.eventId());
            response.setStatusCode(500);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(new ErrorResponse("Failed to create fulfilment session for event ID: " + data.eventId())));
        }
    }

    private static List<FulfilmentEntityType> toFulfilmentEntityTypes(List<String> fulfilmentEntityTypeStrings) {
        return fulfilmentEntityTypeStrings
                .stream()
                .map(FulfilmentEntityType::valueOf)
                .toList();
    }
}
