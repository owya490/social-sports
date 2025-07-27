package com.functions.events.controllers;

import static com.functions.events.services.EventsService.createEvent;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.NewEventData;
import com.functions.firebase.services.FirebaseService;
import com.functions.utils.JavaUtils;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

public class CreateEventEndpoint implements HttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(CreateEventEndpoint.class);

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

        if (!(request.getMethod().equalsIgnoreCase("POST"))) {
            logger.error("Invalid request type made to CreateEventEndpoint: {}", request.getMethod());
            response.setStatusCode(405); // Method Not Allowed
            response.appendHeader("Allow", "POST");
            response.getWriter().write("The CreateEventEndpoint only supports POST requests.");
            return;
        }

        NewEventData data;
        try {
            data = JavaUtils.objectMapper.readValue(request.getReader(), NewEventData.class);
        } catch (Exception e) {
            response.setStatusCode(400);
            logger.error("Could not parse input", e);
            response.getWriter().write("Invalid request data: " + e);
            return;
        }

        Firestore db = FirebaseService.getFirestore();

        try {
            String eventId = db.runTransaction(transaction -> createEvent(data, transaction)).get();

            response.setStatusCode(200);
            response.getWriter().write("Event created successfully with ID: " + eventId + "\n");
        } catch (Exception e) {
            response.setStatusCode(500);
            response.getWriter().write("Error creating event: " + e.getMessage());
        }
    }
}
