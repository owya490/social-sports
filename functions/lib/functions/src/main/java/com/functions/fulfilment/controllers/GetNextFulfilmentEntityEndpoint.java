package com.functions.fulfilment.controllers;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.fulfilment.models.requests.GetNextFulfilmentEntityRequest;
import com.functions.fulfilment.models.responses.GetNextFulfilmentEntityResponse;
import com.functions.fulfilment.services.FulfilmentService;
import com.functions.global.models.responses.ErrorResponse;
import com.functions.utils.JavaUtils;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

public class GetNextFulfilmentEntityEndpoint implements HttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(GetNextFulfilmentEntityEndpoint.class);

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
                    "[GetNextFulfilmentEntityEndpoint] GetNextFulfilmentEntityEndpoint only supports POST requests.")));
            return;
        }

        GetNextFulfilmentEntityRequest data;
        try {
            data = JavaUtils.objectMapper.readValue(request.getReader(), GetNextFulfilmentEntityRequest.class);
        } catch (Exception e) {
            response.setStatusCode(400);
            logger.error("Could not parse input:", e);
            response.getWriter().write(JavaUtils.objectMapper
                    .writeValueAsString(new ErrorResponse("Invalid request data: " + e.getMessage())));
            return;
        }

        Optional<GetNextFulfilmentEntityResponse> maybeResponse = FulfilmentService.getNextFulfilmentEntityByCurrentId(
                data.fulfilmentSessionId(),
                data.currentFulfilmentEntityId());

        if (maybeResponse.isPresent()) {
            logger.info("Next fulfilment entity retrieved successfully for session: {}",
                    data.fulfilmentSessionId());
            response.setStatusCode(200);
            response.getWriter().write(
                    JavaUtils.objectMapper.writeValueAsString(maybeResponse.get()));
        } else {
            logger.info("No more fulfilment entities found for session: {}", data.fulfilmentSessionId());
            response.setStatusCode(404);
            response.getWriter().write(
                    JavaUtils.objectMapper.writeValueAsString(new ErrorResponse(
                            "No more fulfilment entities found for session: " + data.fulfilmentSessionId())));
        }
    }
}
