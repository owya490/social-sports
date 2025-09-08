package com.functions.fulfilment.controllers;

import com.functions.fulfilment.models.requests.UpdateFulfilmentEntityWithFormResponseIdRequest;
import com.functions.fulfilment.services.FulfilmentService;
import com.functions.global.models.responses.ErrorResponse;
import com.functions.utils.JavaUtils;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class UpdateFulfilmentEntityWithFormResponseIdEndpoint implements HttpFunction {
    private static final Logger logger = LoggerFactory
            .getLogger(UpdateFulfilmentEntityWithFormResponseIdEndpoint.class);

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        // Set CORS headers for all responses
        response.appendHeader("Access-Control-Allow-Origin", "*");
        response.appendHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.appendHeader("Access-Control-Max-Age", "3600"); // Cache preflight for 1 hour

        // Handle preflight (OPTIONS) requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            logger.info("Handling OPTIONS request: {}", request);
            response.setStatusCode(204); // No Content
            return;
        }

        if (!(request.getMethod().equalsIgnoreCase("POST"))) {
            logger.warn("Invalid request type made to UpdateFulfilmentEntityWithFormResponseIdEndpoint: {}",
                    request.getMethod());
            response.setStatusCode(405); // Method Not Allowed
            response.appendHeader("Allow", "POST");
            response.getWriter()
                    .write(JavaUtils.objectMapper.writeValueAsString(
                            new ErrorResponse(
                                    "The UpdateFulfilmentEntityWithFormResponseIdEndpoint only supports POST requests.")));
            return;
        }

        UpdateFulfilmentEntityWithFormResponseIdRequest data;
        try {
            data = JavaUtils.objectMapper.readValue(request.getReader(),
                    UpdateFulfilmentEntityWithFormResponseIdRequest.class);
        } catch (Exception e) {
            response.setStatusCode(400);
            logger.error("Could not parse input:", e);
            response.getWriter().write(JavaUtils.objectMapper
                    .writeValueAsString(
                            new ErrorResponse("Invalid request data: " + e.getMessage())));
            return;
        }

        boolean success = FulfilmentService.updateFulfilmentEntityWithFormResponseId(data.fulfilmentSessionId(),
                data.fulfilmentEntityId(), data.formResponseId());

        if (success) {
            response.setStatusCode(200);
            response.getWriter().write("Fulfilment entity updated successfully.\n");
        } else {
            logger.error(
                    "Failed to update fulfilment entity with form response ID for session ID: {} and entity ID: {}",
                    data.fulfilmentSessionId(), data.fulfilmentEntityId());
            response.setStatusCode(500);
            response.getWriter().write(
                    JavaUtils.objectMapper.writeValueAsString(new ErrorResponse(
                            "Error updating fulfilment entity " + data.fulfilmentEntityId()
                                    + " for session: "
                                    + data.fulfilmentSessionId()
                                    + " with form response ID: "
                                    + data.formResponseId())));
        }

    }

}
