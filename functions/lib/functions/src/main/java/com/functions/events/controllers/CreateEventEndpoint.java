package com.functions.events.controllers;

import com.functions.FirebaseService;
import com.functions.events.models.NewEventData;
import com.functions.utils.JavaUtils;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static com.functions.events.services.EventsService.createEvent;

public class CreateEventEndpoint implements HttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(CreateEventEndpoint.class);

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        // response.appendHeader(ACCESS_ALLOW_ORIGIN_HEADER, "https://www.sportshub.net.au");
        // response.appendHeader(ACCESS_ALLOW_ORIGIN_HEADER, "http://localhost:3000");
        // response.appendHeader(ACCESS_ALLOW_METHODS_HEADER, "GET");
        // response.appendHeader(ACCESS_ALLOW_HEADERS_HEADER, "Content-Type");

        // if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
        // 	response.setStatusCode(204); // No Content
        // 	return;
        // }

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatusCode(204); // No Content
            return;
        }

        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            response.setStatusCode(405); // Method Not Allowed
            response.appendHeader("Allow", "POST");
            response.getWriter().write("This function only supports POST requests.");
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
            String eventId = db.runTransaction(transaction ->
                    createEvent(data, transaction)
            ).get();

            response.setStatusCode(200);
            response.getWriter().write("Event created successfully with ID: " + eventId + "\n");
        } catch (Exception e) {
            response.setStatusCode(500);
            response.getWriter().write("Error creating event: " + e.getMessage());
        }
    }
}
