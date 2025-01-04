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

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        if (!"GET".equalsIgnoreCase(request.getMethod())) {
            response.setStatusCode(405); // Method Not Allowed
            response.appendHeader("Allow", "GET"); // Inform client that only GET is allowed
            response.getWriter().write("This function only supports GET requests.");
            return;
        }

        LocalDate today = LocalDate.now();
        List<String> createdEvents = createEventsFromRecurrenceTemplates(today);

        response.getWriter().write("Recurring events processed for: " + today + "Created events: " + createdEvents);
    }
}
