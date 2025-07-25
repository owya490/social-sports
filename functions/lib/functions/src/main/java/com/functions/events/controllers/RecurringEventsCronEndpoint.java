package com.functions.events.controllers;

import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

import static com.functions.events.services.RecurringEventsCronService.createEventsFromRecurrenceTemplates;

public class RecurringEventsCronEndpoint implements HttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(RecurringEventsCronEndpoint.class);

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        // Set CORS headers for all responses
        response.appendHeader("Access-Control-Allow-Origin", "*");
        response.appendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.appendHeader("Access-Control-Max-Age", "3600"); // Cache preflight for 1 hour

        // Handle preflight (OPTIONS) requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            logger.info("Handling OPTIONS request: {}", request);
            response.setStatusCode(204); // No Content
            return;
        }

        if (!(request.getMethod().equalsIgnoreCase("GET"))) {
            response.setStatusCode(405); // Method Not Allowed
            response.appendHeader("Allow", "GET"); // Inform client that only GET is allowed
            response.getWriter().write("The RecurringEventsConEndpoint only supports GET requests.");
            return;
        }

        ZoneId sydneyZone = ZoneId.of("Australia/Sydney");
        LocalDate sydneyDate = ZonedDateTime.now(sydneyZone).toLocalDate();

        List<String> createdEvents = createEventsFromRecurrenceTemplates(sydneyDate);

        response.getWriter()
                .write("Recurring events processed for: " + sydneyDate + "Created events: " + createdEvents);
    }
}
