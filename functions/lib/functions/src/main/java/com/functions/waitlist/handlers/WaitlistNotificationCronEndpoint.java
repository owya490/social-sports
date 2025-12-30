package com.functions.waitlist.handlers;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.fulfilment.services.FulfilmentService;
import com.functions.global.models.responses.ErrorResponse;
import com.functions.utils.JavaUtils;
import com.functions.waitlist.models.WaitlistEntry;
import com.functions.waitlist.repositories.WaitlistRepository;
import com.functions.emails.EmailService;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

public class WaitlistNotificationCronEndpoint implements HttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(WaitlistNotificationCronEndpoint.class);
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

        if (!(request.getMethod().equalsIgnoreCase("POST"))) {
            response.setStatusCode(405); // Method Not Allowed
            response.appendHeader("Allow", "POST");
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse("The CompleteFulfilmentSessionEndpoint only supports POST requests.")));
            return;
        }

        try {
            // for all waitlist pools, send email notifications to all waitlist entries. 
            List<String> waitlistPoolIds = WaitlistRepository.getWaitlistByEventId();
            for (String waitlistPoolId : waitlistPoolIds) {
                List<WaitlistEntry> waitlistEntries = WaitlistRepository.getAllWaitlistEntries(waitlistPool.getId());
                for (WaitlistEntry waitlistEntry : waitlistEntries) {
                    EmailService.sendWaitlistEmailNotification(waitlistPool.getName(), waitlistEntry.getName(), waitlistEntry.getEmail());
                }
            }
            response.setStatusCode(200);
            logger.info("Cleanup completed. Deleted sessions: {}", deleted);
            response.getWriter().write("Cleanup completed. Deleted sessions: " + deleted + "\n");
        } catch (Exception e) {
            logger.error("Error during cleanup of old fulfilment sessions", e);
            response.setStatusCode(500);
            response.getWriter().write("Error during cleanup: " + e.getMessage());
        }
    }
}
