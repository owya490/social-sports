package com.functions.fulfilment.controllers;

import com.functions.fulfilment.services.FulfilmentService;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class CleanupOldFulfilmentSessionsCronEndpoint implements HttpFunction {
    private static final Logger logger =
            LoggerFactory.getLogger(CleanupOldFulfilmentSessionsCronEndpoint.class);

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        logger.info("Received {} request to CleanupOldFulfilmentSessionsCronEndpoint",
                request.getMethod());

        // Set CORS headers for all responses
        response.appendHeader("Access-Control-Allow-Origin", "*");
        response.appendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.appendHeader("Access-Control-Max-Age", "3600"); // Cache preflight for 1 hour

        // Handle preflight (OPTIONS) requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            logger.debug("Handling CORS preflight request");
            response.setStatusCode(204); // No Content
            return;
        }

        if (!(request.getMethod().equalsIgnoreCase("GET"))) {
            logger.warn("Invalid HTTP method: {} (expected GET)", request.getMethod());
            response.setStatusCode(405); // Method Not Allowed
            response.appendHeader("Allow", "GET");
            response.getWriter().write(
                    "The CleanupOldFulfilmentSessionsCronEndpoint only supports GET requests.");
            return;
        }

        logger.info("Starting cleanup of old fulfilment sessions");
        try {
            int deleted = FulfilmentService.cleanupOldFulfilmentSessions();
            response.setStatusCode(200);
            logger.info("Cleanup operation completed successfully - deleted {} sessions", deleted);
            response.getWriter().write("Cleanup completed. Deleted sessions: " + deleted + "\n");
        } catch (Exception e) {
            logger.error("Error during cleanup of old fulfilment sessions", e);
            response.setStatusCode(500);
            response.getWriter().write("Error during cleanup: " + e.getMessage());
        }
    }
}
