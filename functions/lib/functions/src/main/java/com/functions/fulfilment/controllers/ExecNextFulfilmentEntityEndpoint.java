package com.functions.fulfilment.controllers;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.fulfilment.models.requests.ExecNextFulfilmentEntityRequest;
import com.functions.fulfilment.models.responses.ExecNextFulfilmentEntityResponse;
import com.functions.fulfilment.services.FulfilmentService;
import com.functions.global.models.responses.ErrorResponse;
import com.functions.utils.JavaUtils;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

public class ExecNextFulfilmentEntityEndpoint implements HttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(ExecNextFulfilmentEntityEndpoint.class);

    /**
     * Handles HTTP requests to execute the next fulfilment entity in a session.
     *
     * <p>Supports only POST requests with a JSON body containing a fulfilment session ID.
     * Responds with appropriate CORS headers for all requests, including handling OPTIONS preflight requests.
     * Returns a 200 OK response with the next fulfilment entity if found, 404 Not Found if not found,
     * 400 Bad Request for invalid input, and 405 Method Not Allowed for unsupported HTTP methods.
     * All responses are serialized as JSON.
     *
     * @param request the incoming HTTP request
     * @param response the HTTP response to be sent
     * @throws Exception if an unexpected error occurs during request processing
     */
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
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(new ErrorResponse("The ExecNextFulfilmentEntityEndpoing only supports POST requests.")));
            return;
        }

        ExecNextFulfilmentEntityRequest data;
        try {
            data = JavaUtils.objectMapper.readValue(request.getReader(), ExecNextFulfilmentEntityRequest.class);
        } catch (Exception e) {
            response.setStatusCode(400);
            logger.error("Could not parse input:", e);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(new ErrorResponse("Invalid request data: " + e.getMessage())));
            return;
        }

        Optional<ExecNextFulfilmentEntityResponse> maybeResponse = FulfilmentService.execNextFulfilmentEntity(data.fulfilmentSessionId());

        if (maybeResponse.isPresent()) {
            logger.info("Next fulfilment entity executed successfully for session: {}", data.fulfilmentSessionId());
            response.setStatusCode(200);
            response.getWriter().write(
                    JavaUtils.objectMapper.writeValueAsString(maybeResponse.get())
            );
        } else {
            logger.error("No next fulfilment entity found for session: {}", data.fulfilmentSessionId());
            response.setStatusCode(404);
            response.getWriter().write(
                    JavaUtils.objectMapper.writeValueAsString(new ErrorResponse("No next fulfilment entity found for session: " + data.fulfilmentSessionId()))
            );
        }
    }
}
