package com.functions.fulfilment.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.fulfilment.models.requests.CompleteFulfilmentSessionRequest;
import com.functions.fulfilment.services.FulfilmentService;
import com.functions.global.controllers.AbstractConfiguredHttpFunction;
import com.functions.global.models.responses.ErrorResponse;
import com.functions.utils.JavaUtils;
import com.functions.utils.logging.RequestLogContext;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

public class CompleteFulfilmentSessionEndpoint extends AbstractConfiguredHttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(CompleteFulfilmentSessionEndpoint.class);

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        long startNanos = System.nanoTime();
        String statusCode = "500";

        // Set CORS headers for all responses
        response.appendHeader("Access-Control-Allow-Origin", "*");
        response.appendHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.appendHeader("Access-Control-Max-Age", "3600"); // Cache preflight for 1 hour

        RequestLogContext logContext =
                RequestLogContext.fromHttpRequest("CompleteFulfilmentSessionEndpoint", request).activate();
        try (logContext) {
            logger.info("HTTP request started {}", logContext.format("event", "http_request_start"));

            // Handle preflight (OPTIONS) requests
            if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
                statusCode = "204";
                response.setStatusCode(204); // No Content
                return;
            }

            if (!(request.getMethod().equalsIgnoreCase("POST"))) {
                statusCode = "405";
                response.setStatusCode(405); // Method Not Allowed
                response.appendHeader("Allow", "POST");
                response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                        new ErrorResponse("The CompleteFulfilmentSessionEndpoint only supports POST requests.")));
                return;
            }

            CompleteFulfilmentSessionRequest data;
            try {
                data = JavaUtils.objectMapper.readValue(request.getReader(), CompleteFulfilmentSessionRequest.class);
                logContext.withField("fulfilmentSessionId", data.fulfilmentSessionId())
                        .withField("fulfilmentEntityId", data.fulfilmentEntityId());
            } catch (Exception e) {
                statusCode = "400";
                response.setStatusCode(400);
                logger.error("Could not parse input {}", logContext.format("event", "request_parse_failed"), e);
                response.getWriter().write(JavaUtils.objectMapper
                        .writeValueAsString(new ErrorResponse("Invalid request data: " + e.getMessage())));
                return;
            }

            boolean success = FulfilmentService.completeFulfilmentSession(data.fulfilmentSessionId(),
                    data.fulfilmentEntityId());

            if (success) {
                statusCode = "200";
                logger.info("Fulfilment session completed successfully {}",
                        logContext.format("event", "fulfilment_session_completed"));

                response.setStatusCode(200);
                response.getWriter().write(
                        "Fulfilment session completed successfully.");
            } else {
                statusCode = "500";
                logger.error("Failed to complete fulfilment session {}",
                        logContext.format("event", "fulfilment_session_completion_failed"));
                response.setStatusCode(500);
                response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                        new ErrorResponse("Failed to complete fulfilment session for ID: " + data.fulfilmentSessionId() +
                                " and entity ID: " + data.fulfilmentEntityId())));
            }
        } finally {
            long durationMs = (System.nanoTime() - startNanos) / 1_000_000;
            logger.info("HTTP request finished {}",
                    logContext.format("event", "http_request_finish", "statusCode", statusCode, "durationMs", durationMs));
        }
    }
}
