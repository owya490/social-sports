package com.functions.waitlist.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.global.models.responses.ErrorResponse;
import com.functions.utils.JavaUtils;
import com.functions.waitlist.models.requests.JoinWaitlistRequest;
import com.functions.waitlist.models.responses.JoinWaitlistResponse;
import com.functions.waitlist.services.WaitlistService;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

/**
 * HTTP endpoint for joining an event waitlist.
 * 
 * POST /joinWaitlist
 * Body: { eventId, name, email, ticketCount }
 */
public class JoinWaitlistEndpoint implements HttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(JoinWaitlistEndpoint.class);

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        // Set CORS headers for all responses
        response.appendHeader("Access-Control-Allow-Origin", "*");
        response.appendHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.appendHeader("Access-Control-Max-Age", "3600"); // Cache preflight for 1 hour

        // Handle preflight (OPTIONS) requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            logger.info("Handling OPTIONS request");
            response.setStatusCode(204); // No Content
            return;
        }

        // Only allow POST requests
        if (!(request.getMethod().equalsIgnoreCase("POST"))) {
            response.setStatusCode(405); // Method Not Allowed
            response.appendHeader("Allow", "POST");
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse("The JoinWaitlistEndpoint only supports POST requests.")));
            return;
        }

        // Parse request body
        JoinWaitlistRequest data;
        try {
            data = JavaUtils.objectMapper.readValue(request.getReader(), JoinWaitlistRequest.class);
        } catch (Exception e) {
            response.setStatusCode(400);
            logger.error("Could not parse input:", e);
            response.getWriter().write(JavaUtils.objectMapper
                    .writeValueAsString(new ErrorResponse("Invalid request data: " + e.getMessage())));
            return;
        }

        // Validate required fields
        if (data.getEventId() == null || data.getEventId().isEmpty()) {
            response.setStatusCode(400);
            response.getWriter().write(JavaUtils.objectMapper
                    .writeValueAsString(new ErrorResponse("eventId is required")));
            return;
        }
        if (data.getEmail() == null || data.getEmail().isEmpty()) {
            response.setStatusCode(400);
            response.getWriter().write(JavaUtils.objectMapper
                    .writeValueAsString(new ErrorResponse("email is required")));
            return;
        }
        // Validate email format
        if (!isValidEmail(data.getEmail())) {
            response.setStatusCode(400);
            response.getWriter().write(JavaUtils.objectMapper
                    .writeValueAsString(new ErrorResponse("invalid email format")));
            return;
        }
        if (data.getName() == null || data.getName().isEmpty()) {
            response.setStatusCode(400);
            response.getWriter().write(JavaUtils.objectMapper
                    .writeValueAsString(new ErrorResponse("name is required")));
            return;
        }
        if (data.getTicketCount() <= 0) {
            response.setStatusCode(400);
            response.getWriter().write(JavaUtils.objectMapper
                    .writeValueAsString(new ErrorResponse("ticketCount must be greater than 0")));
            return;
        }

        // Call service to join waitlist
        logger.info("Processing join waitlist request for event: {}, email: {}", 
                data.getEventId(), data.getEmail());

        JoinWaitlistResponse result = WaitlistService.joinWaitlist(data);

        if (result.isSuccess()) {
            logger.info("User {} successfully joined waitlist for event {}", 
                    data.getEmail(), data.getEventId());
            response.setStatusCode(200);
            response.setContentType("application/json");
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(result));
        } else {
            logger.warn("Failed to join waitlist for event {}: {}", 
                    data.getEventId(), result.getMessage());
            response.setStatusCode(400);
            response.setContentType("application/json");
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(result));
        }
    }

    /**
     * Validates email format using regex pattern
     * @param email The email address to validate
     * @return true if valid, false otherwise
     */
    private boolean isValidEmail(String email) {
        // RFC 5322 compliant regex pattern for email validation
        String emailRegex = "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$";
        return email != null && email.matches(emailRegex);
    }
}

