package com.functions.fulfilment.controllers;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.fulfilment.models.requests.GetFulfilmentEntityInfoRequest;
import com.functions.fulfilment.models.responses.GetFulfilmentEntityInfoResponse;
import com.functions.fulfilment.services.FulfilmentService;
import com.functions.global.models.responses.ErrorResponse;
import com.functions.utils.JavaUtils;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

public class GetFulfilmentEntityInfoEndpoint implements HttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(GetFulfilmentEntityInfoEndpoint.class);

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
                    "[GetFulfilmentEntityInfoEndpoint] GetFulfilmentEntityInfoEndpoint only supports GET requests.")));
            return;
        }

        GetFulfilmentEntityInfoRequest data;
        try {
            data = JavaUtils.objectMapper.readValue(request.getReader(), GetFulfilmentEntityInfoRequest.class);
        } catch (Exception e) {
            response.setStatusCode(400);
            logger.error("Could not parse input:", e);
            response.getWriter().write(JavaUtils.objectMapper
                    .writeValueAsString(new ErrorResponse("Invalid request data: " + e.getMessage())));
            return;
        }

        Optional<GetFulfilmentEntityInfoResponse> maybeResponse = FulfilmentService.getFulfilmentEntityInfo(
                data.fulfilmentSessionId(),
                data.fulfilmentEntityId());

        if (maybeResponse.isPresent()) {
            logger.info("Fulfilment entity info retrieved successfully for session: {}",
                    data.fulfilmentSessionId());
            response.setStatusCode(200);
            response.getWriter().write(
                    JavaUtils.objectMapper.writeValueAsString(maybeResponse.get()));
        } else {
            logger.info("No fulfilment entity info found for session: {}", data.fulfilmentSessionId());
            response.setStatusCode(404);
            response.getWriter().write(
                    JavaUtils.objectMapper.writeValueAsString(new ErrorResponse(
                            "No fulfilment entity info found for session: " + data.fulfilmentSessionId())));
        }
    }
}
