package com.functions.fulfilment.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.fulfilment.models.requests.DeleteFulfilmentSessionRequest;
import com.functions.fulfilment.services.FulfilmentService;
import com.functions.global.models.responses.ErrorResponse;
import com.functions.utils.JavaUtils;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

// TODO: we can probably deprecate and remove this endpoint since we should be using `completeFulfilmentSessionEndpoint` instead
public class DeleteFulfilmentSessionEndpoint implements HttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(DeleteFulfilmentSessionEndpoint.class);

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
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(new ErrorResponse(
                    "[DeleteFulfilmentSessionEndpoint] DeleteFulfilmentSessionEndpoint only supports POST requests.")));
            return;
        }

        DeleteFulfilmentSessionRequest data;
        try {
            data = JavaUtils.objectMapper.readValue(request.getReader(), DeleteFulfilmentSessionRequest.class);
        } catch (Exception e) {
            response.setStatusCode(400);
            logger.error("Could not parse input:", e);
            response.getWriter().write(JavaUtils.objectMapper
                    .writeValueAsString(new ErrorResponse("Invalid request data: " + e.getMessage())));
            return;
        }

        try {
            FulfilmentService.deleteFulfilmentSessionAndTempFormResponses(data.fulfilmentSessionId());
            logger.info("Fulfilment session deleted for ID: {}", data.fulfilmentSessionId());
            response.setStatusCode(200);
            response.getWriter().write("Fulfilment session deleted successfully.\n");
        } catch (Exception e) {
            logger.error("Failed to delete fulfilment session for ID: {}", data.fulfilmentSessionId(), e);
            response.setStatusCode(500);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse("Failed to delete fulfilment session for ID: " + data.fulfilmentSessionId())));
        }
    }
}
