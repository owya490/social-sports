package com.functions.events.controllers;

import com.functions.events.models.requests.CreateRecurrenceTemplateRequest;
import com.functions.events.models.responses.CreateRecurrenceTemplateResponse;
import com.functions.events.services.RecurringEventsService;
import com.functions.utils.JavaUtils;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.Optional;

public class CreateRecurrenceTemplateEndpoint implements HttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(CreateRecurrenceTemplateEndpoint.class);

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        // Set CORS headers for all responses
        response.appendHeader("Access-Control-Allow-Origin", "*");
        response.appendHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.appendHeader("Access-Control-Max-Age", "3600"); // Cache preflight for 1 hour

        // Handle preflight (OPTIONS) requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            logger.info("Handling OPTIONS request: {}", request);
            response.setStatusCode(204); // No Content
            return;
        }

        // Handle actual (POST) request
        if (!request.getMethod().equalsIgnoreCase("POST")) {
            logger.warn("Invalid request type made to CreateRecurrenceTemplateEndpoint: {}", request.getMethod());
            response.setStatusCode(405); // Method Not Allowed
            response.appendHeader("Allow", "POST"); // Inform client that only GET is allowed
            response.getWriter().write("The CreateRecurrenceTemplateEndpoint only supports POST requests.");
            return;
        }

        CreateRecurrenceTemplateRequest data;
        try {
            data = JavaUtils.objectMapper.readValue(request.getReader(), CreateRecurrenceTemplateRequest.class);
        } catch (Exception e) {
            response.setStatusCode(400);
            logger.error("Could not parse input", e);
            response.getWriter().write("Invalid request data: " + e);
            return;
        }

        Optional<Map.Entry<String, String>> maybeRecurrenceTemplateId = RecurringEventsService
                .createRecurrenceTemplate(data.eventData(), data.recurrenceData());

        if (maybeRecurrenceTemplateId.isPresent()) {
            logger.info("Recurrence template successfully created: {}", maybeRecurrenceTemplateId);
            response.setStatusCode(200);
            response.getWriter().write(
                    JavaUtils.objectMapper.writeValueAsString(
                            new CreateRecurrenceTemplateResponse(maybeRecurrenceTemplateId.get().getKey(),
                                    maybeRecurrenceTemplateId.get().getValue())));
        } else {
            logger.error("Recurrence template failed to be created");
            response.setStatusCode(500);
            response.getWriter().write(
                    JavaUtils.objectMapper.writeValueAsString(
                            new CreateRecurrenceTemplateResponse("", "")));
        }
    }
}