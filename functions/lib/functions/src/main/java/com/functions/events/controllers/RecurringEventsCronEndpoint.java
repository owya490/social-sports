package com.functions.events.controllers;

import com.functions.global.controllers.AbstractConfiguredHttpFunction;
import com.functions.utils.logging.RequestLogContext;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

import static com.functions.events.services.RecurringEventsCronService.createEventsFromRecurrenceTemplates;

public class RecurringEventsCronEndpoint extends AbstractConfiguredHttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(RecurringEventsCronEndpoint.class);

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        long startNanos = System.nanoTime();
        String statusCode = "500";

        // Set CORS headers for all responses
        response.appendHeader("Access-Control-Allow-Origin", "*");
        response.appendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.appendHeader("Access-Control-Max-Age", "3600"); // Cache preflight for 1 hour

        RequestLogContext logContext =
                RequestLogContext.fromHttpRequest("RecurringEventsCronEndpoint", request).activate();
        try (logContext) {
            logger.info("HTTP request started {}", logContext.format("event", "http_request_start"));

            // Handle preflight (OPTIONS) requests
            if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
                statusCode = "204";
                response.setStatusCode(204); // No Content
                return;
            }

            if (!(request.getMethod().equalsIgnoreCase("GET"))) {
                statusCode = "405";
                response.setStatusCode(405); // Method Not Allowed
                response.appendHeader("Allow", "GET"); // Inform client that only GET is allowed
                response.getWriter().write("The RecurringEventsConEndpoint only supports GET requests.");
                return;
            }

            ZoneId sydneyZone = ZoneId.of("Australia/Sydney");
            LocalDate sydneyDate = ZonedDateTime.now(sydneyZone).toLocalDate();
            logContext.withField("sydneyDate", sydneyDate);

            List<String> createdEvents = createEventsFromRecurrenceTemplates(sydneyDate);
            logger.info("Recurring events cron completed {}",
                    logContext.format("event", "recurring_events_cron_completed", "createdCount", createdEvents.size()));

            statusCode = "200";
            response.getWriter()
                    .write("Recurring events processed for: " + sydneyDate + ". Created events: " + createdEvents);
        } finally {
            long durationMs = (System.nanoTime() - startNanos) / 1_000_000;
            logger.info("HTTP request finished {}",
                    logContext.format("event", "http_request_finish", "statusCode", statusCode, "durationMs", durationMs));
        }
    }
}
