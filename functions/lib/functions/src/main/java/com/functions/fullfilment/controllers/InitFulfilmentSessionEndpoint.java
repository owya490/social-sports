package com.functions.fullfilment.controllers;

import com.functions.fullfilment.models.FulfilmentEntityType;
import com.functions.fullfilment.models.requests.InitCheckoutFulfilmentSessionRequest;
import com.functions.fullfilment.models.responses.InitCheckoutFulfilmentSessionResponse;
import com.functions.fullfilment.services.FulfilmentService;
import com.functions.utils.JavaUtils;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Optional;

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
            response.getWriter().write("The InitFulfilmentSessionEndpoint only supports POST requests.");
            return;
        }

        InitCheckoutFulfilmentSessionRequest data;
        try {
            data = com.functions.utils.JavaUtils.objectMapper.readValue(request.getReader(), InitCheckoutFulfilmentSessionRequest.class);
        } catch (Exception e) {
            response.setStatusCode(400);
            logger.error("Could not parse input", e);
            response.getWriter().write("Invalid request data: " + e);
            return;
        }

        Optional<String> maybeFulfilmentSessionId = FulfilmentService.initCheckoutFulfilmentSession(data.eventId(), data.numTickets(), toFulfilmentEntityTypes(data.fulfilmentEntityTypes()), data.endUrl());

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
            response.getWriter().write("Failed to create fulfilment session.");
        }
    }

    private static List<FulfilmentEntityType> toFulfilmentEntityTypes(List<String> fulfilmentEntityTypeStrings) {
        return fulfilmentEntityTypeStrings
                .stream()
                .map(FulfilmentEntityType::fromTypeNameString)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .toList();
    }
}
