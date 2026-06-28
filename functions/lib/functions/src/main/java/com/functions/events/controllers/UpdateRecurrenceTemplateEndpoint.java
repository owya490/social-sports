package com.functions.events.controllers;

import com.functions.events.models.requests.UpdateRecurrenceTemplateRequest;
import com.functions.events.models.responses.UpdateRecurrenceTemplateResponse;
import com.functions.events.services.RecurringEventsService;
import com.functions.global.controllers.AbstractConfiguredHttpFunction;
import com.functions.utils.JavaUtils;
import com.functions.utils.logging.RequestLogContext;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

public class UpdateRecurrenceTemplateEndpoint extends AbstractConfiguredHttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(UpdateRecurrenceTemplateEndpoint.class);

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
                RequestLogContext.fromHttpRequest("UpdateRecurrenceTemplateEndpoint", request).activate();
        try (logContext) {
            logger.info("HTTP request started {}", logContext.format("event", "http_request_start"));

            // Handle preflight (OPTIONS) requests
            if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
                statusCode = "204";
                response.setStatusCode(204); // No Content
                return;
            }

            if (!request.getMethod().equalsIgnoreCase("POST")) {
                statusCode = "405";
                response.setStatusCode(405); // Method Not Allowed
                response.appendHeader("Allow", "POST"); // Inform client that only GET is allowed
                response.getWriter().write("The UpdateRecurrenceTemplateEndpoint only supports POST requests.");
                return;
            }

            UpdateRecurrenceTemplateRequest data;
            try {
                data = JavaUtils.objectMapper.readValue(request.getReader(), UpdateRecurrenceTemplateRequest.class);
                logContext.withField("recurrenceTemplateId", data.recurrenceTemplateId());
            } catch (Exception e) {
                statusCode = "400";
                response.setStatusCode(400);
                logger.error("Could not parse input {}", logContext.format("event", "request_parse_failed"), e);
                response.getWriter().write("Invalid request data: " + e);
                return;
            }

            Optional<String> maybeRecurrenceTemplateId = RecurringEventsService
                    .updateRecurrenceTemplate(data.recurrenceTemplateId(), data.eventData(), data.recurrenceData());

            if (maybeRecurrenceTemplateId.isPresent()) {
                statusCode = "200";
                logger.info("Recurrence template updated {}",
                        logContext.format("event", "recurrence_template_updated"));
                response.setStatusCode(200);
                response.getWriter().write(
                        JavaUtils.objectMapper.writeValueAsString(
                                new UpdateRecurrenceTemplateResponse(maybeRecurrenceTemplateId.get())));
            } else {
                statusCode = "500";
                logger.error("Recurrence template update failed {}",
                        logContext.format("event", "recurrence_template_update_failed"));
                response.setStatusCode(500);
                response.getWriter().write(
                        JavaUtils.objectMapper.writeValueAsString(
                                new UpdateRecurrenceTemplateResponse("")));
            }
        } finally {
            long durationMs = (System.nanoTime() - startNanos) / 1_000_000;
            logger.info("HTTP request finished {}",
                    logContext.format("event", "http_request_finish", "statusCode", statusCode, "durationMs", durationMs));
        }
    }
}
