package com.functions.fulfilment.controllers;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.fulfilment.models.requests.GetPrevFulfilmentEntityRequest;
import com.functions.fulfilment.models.responses.GetPrevFulfilmentEntityResponse;
import com.functions.fulfilment.services.FulfilmentService;
import com.functions.global.models.responses.ErrorResponse;
import com.functions.utils.JavaUtils;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

public class GetPrevFulfilmentEntityEndpoint implements HttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(GetPrevFulfilmentEntityEndpoint.class);

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
                    "[GetPrevFulfilmentEntityEndpoint] GetPrevFulfilmentEntityEndpoint only supports POST requests.")));
            return;
        }

        GetPrevFulfilmentEntityRequest data;
        try {
            data = JavaUtils.objectMapper.readValue(request.getReader(), GetPrevFulfilmentEntityRequest.class);
        } catch (Exception e) {
            response.setStatusCode(400);
            logger.error("Could not parse input:", e);
            response.getWriter().write(JavaUtils.objectMapper
                    .writeValueAsString(new ErrorResponse("Invalid request data: " + e.getMessage())));
            return;
        }

        // Use the new service method that handles entity IDs directly
        Optional<GetPrevFulfilmentEntityResponse> maybeResponse = FulfilmentService.getPrevFulfilmentEntityByCurrentId(
                data.fulfilmentSessionId(),
                data.currentFulfilmentEntityId());

        if (maybeResponse.isPresent()) {
            logger.info("Previous fulfilment entity retrieved successfully for session: {}",
                    data.fulfilmentSessionId());
            response.setStatusCode(200);
            response.getWriter().write(
                    JavaUtils.objectMapper.writeValueAsString(maybeResponse.get()));
        } else {
            logger.info("No previous fulfilment entities found for session: {}", data.fulfilmentSessionId());
            response.setStatusCode(404);
            response.getWriter().write(
                    JavaUtils.objectMapper.writeValueAsString(new ErrorResponse(
                            "No previous fulfilment entities found for session: " + data.fulfilmentSessionId())));
        }
    }
}
