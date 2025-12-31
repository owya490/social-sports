package com.functions.waitlist.handlers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.waitlist.services.WaitlistNotificationService;
import com.functions.waitlist.services.WaitlistNotificationService.NotificationResult;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

/**
 * Cron endpoint that sends waitlist notification emails to ALL waitlists.
 * Processes all events with waitlists and notifies users who haven't been notified yet.
 */
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
            response.setStatusCode(204); // No Content
            return;
        }

        if (!(request.getMethod().equalsIgnoreCase("GET"))) {
            response.setStatusCode(405); // Method Not Allowed
            response.appendHeader("Allow", "GET");
            response.getWriter().write("The WaitlistNotificationCronEndpoint only supports GET requests.");
            return;
        }

        logger.info("[WaitlistNotificationCronEndpoint] Starting waitlist notification cron job");

        NotificationResult result = WaitlistNotificationService.notifyAllWaitlists();

        if (result.failedCount() == 0) {
            response.setStatusCode(200);
        } else {
            response.setStatusCode(500);
        }
        response.getWriter().write("Waitlist notification cron completed. Notified: " + result.notifiedCount() + " failed: " + result.failedCount());
    }
}
