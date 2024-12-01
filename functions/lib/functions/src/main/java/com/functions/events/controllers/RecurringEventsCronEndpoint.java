package com.functions.events.controllers;

import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.util.List;

import static com.functions.events.services.RecurringEventsCronService.createEventsFromRecurrenceTemplates;

public class RecurringEventsCronEndpoint implements HttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(RecurringEventsCronEndpoint.class);
    private static final String CLOUD_RUN_URL = "https://australia-southeast1-socialsports-44162.cloudfunctions.net/recurringEventsCron";

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        if (!"GET".equalsIgnoreCase(request.getMethod())) {
            response.setStatusCode(405); // Method Not Allowed
            response.appendHeader("Allow", "GET"); // Inform client that only GET is allowed
            response.getWriter().write("This function only supports GET requests.");
            return;
        }

        // Protect endpoint
        try {
            AuthUtils.authenticateOIDCToken(request, response, logger, CLOUD_RUN_URL);
        } catch (Exception e) {
            logger.error(e.getMessage());
            return;
        }

        // Process recurring events
        LocalDate today = LocalDate.now();
        List<String> createdEvents = createEventsFromRecurrenceTemplates(today);

        response.setStatusCode(200);
        response.getWriter().write("Recurring events processed for: " + today + "Created events: " + createdEvents);
    }
}
