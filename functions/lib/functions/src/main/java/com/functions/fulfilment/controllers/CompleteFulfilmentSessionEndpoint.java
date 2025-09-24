package com.functions.fulfilment.controllers;

import com.functions.fulfilment.models.requests.CompleteFulfilmentSessionRequest;
import com.functions.fulfilment.services.FulfilmentService;
import com.functions.global.models.responses.ErrorResponse;
import com.functions.utils.JavaUtils;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class CompleteFulfilmentSessionEndpoint implements HttpFunction {
    private static final Logger logger =
            LoggerFactory.getLogger(CompleteFulfilmentSessionEndpoint.class);

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        logger.debug("Received {} request to CompleteFulfilmentSessionEndpoint",
                request.getMethod());

        // Set CORS headers for all responses
        response.appendHeader("Access-Control-Allow-Origin", "*");
        response.appendHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.appendHeader("Access-Control-Max-Age", "3600"); // Cache preflight for 1 hour

        // Handle preflight (OPTIONS) requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            logger.debug("Handling CORS preflight request");
            response.setStatusCode(204); // No Content
            return;
        }

        if (!(request.getMethod().equalsIgnoreCase("POST"))) {
            logger.warn("Invalid HTTP method: {} (expected POST)", request.getMethod());
            response.setStatusCode(405); // Method Not Allowed
            response.appendHeader("Allow", "POST");
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(new ErrorResponse(
                    "The CompleteFulfilmentSessionEndpoint only supports POST requests.")));
            return;
        }

        logger.debug("Parsing request body");
        CompleteFulfilmentSessionRequest data;
        try {
            data = JavaUtils.objectMapper.readValue(request.getReader(),
                    CompleteFulfilmentSessionRequest.class);
            logger.debug("Successfully parsed request - sessionId: {}, entityId: {}",
                    data.fulfilmentSessionId(), data.fulfilmentEntityId());
        } catch (Exception e) {
            logger.error("Failed to parse CompleteFulfilmentSessionRequest", e);
            response.setStatusCode(400);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse("Invalid request data: " + e.getMessage())));
            return;
        }

        if (data.fulfilmentSessionId() == null || data.fulfilmentEntityId() == null) {
            logger.error("Missing required parameters - sessionId: {}, entityId: {}",
                    data.fulfilmentSessionId(), data.fulfilmentEntityId());
            response.setStatusCode(400);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(new ErrorResponse(
                    "Both fulfilmentSessionId and fulfilmentEntityId are required")));
            return;
        }

        logger.info("Processing fulfilment session completion - sessionId: {}, entityId: {}",
                data.fulfilmentSessionId(), data.fulfilmentEntityId());

        boolean success = FulfilmentService.completeFulfilmentSession(data.fulfilmentSessionId(),
                data.fulfilmentEntityId());

        if (success) {
            logger.info("Successfully completed fulfilment session - sessionId: {}, entityId: {}",
                    data.fulfilmentSessionId(), data.fulfilmentEntityId());

            response.setStatusCode(200);
            response.getWriter().write("Fulfilment session completed successfully.");
        } else {
            logger.error("Failed to complete fulfilment session - sessionId: {}, entityId: {}",
                    data.fulfilmentSessionId(), data.fulfilmentEntityId());
            response.setStatusCode(500);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(new ErrorResponse(
                    "Failed to complete fulfilment session for ID: " + data.fulfilmentSessionId()
                            + " and entity ID: " + data.fulfilmentEntityId())));
        }
    }
}
