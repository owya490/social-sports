package com.functions.fulfilment.controllers;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.fulfilment.repositories.FulfilmentSessionRepository;
import com.functions.fulfilment.services.FulfilmentService;
import com.google.cloud.Timestamp;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

public class CleanupOldFulfilmentSessionsCronEndpoint implements HttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(CleanupOldFulfilmentSessionsCronEndpoint.class);
    private static final int CLEANUP_CUTOFF_MINUTES = 30;

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
            response.appendHeader("Allow", "GET");
            response.getWriter().write("The CleanupOldFulfilmentSessionsCronEndpoint only supports GET requests.");
            return;
        }

        // Calculate cutoff time: now - CLEANUP_CUTOFF_MINUTES
        long nowSeconds = Instant.now().getEpochSecond();
        long cutoffSeconds = nowSeconds - TimeUnit.MINUTES.toSeconds(CLEANUP_CUTOFF_MINUTES);
        Timestamp cutoff = Timestamp.ofTimeSecondsAndNanos(cutoffSeconds, 0);

        int deleted = 0;
        try {
            List<String> oldSessionIds = FulfilmentSessionRepository.listFulfilmentSessionIdsOlderThan(cutoff);
            for (String id : oldSessionIds) {
                try {
                    FulfilmentService.deleteFulfilmentSession(id);
                    deleted++;
                } catch (Exception e) {
                    logger.error("Failed to delete fulfilment session {} during cleanup", id, e);
                }
            }
            response.setStatusCode(200);
            response.getWriter().write("Cleanup completed. Deleted sessions: " + deleted + "\n");
        } catch (Exception e) {
            logger.error("Error during cleanup of old fulfilment sessions", e);
            response.setStatusCode(500);
            response.getWriter().write("Error during cleanup: " + e.getMessage());
        }
    }
}
