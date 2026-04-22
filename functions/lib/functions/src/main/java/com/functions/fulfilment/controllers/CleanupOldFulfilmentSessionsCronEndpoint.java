package com.functions.fulfilment.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.fulfilment.services.FulfilmentService;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

public class CleanupOldFulfilmentSessionsCronEndpoint implements HttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(CleanupOldFulfilmentSessionsCronEndpoint.class);

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

        int stripeExpired = 0;
        int deleted = 0;
        Throwable stripeError = null;
        Throwable cleanupError = null;

        try {
            stripeExpired = FulfilmentService.expireStaleStripeCheckoutSessions();
            logger.info("Stripe checkout expiry pass completed. Sessions expired: {}", stripeExpired);
        } catch (Exception e) {
            stripeError = e;
            logger.error("Error during Stripe checkout expiry pass", e);
        }

        try {
            deleted = FulfilmentService.cleanupOldFulfilmentSessions();
            logger.info("Doc cleanup completed. Deleted sessions: {}", deleted);
        } catch (Exception e) {
            cleanupError = e;
            logger.error("Error during cleanup of old fulfilment sessions", e);
        }

        if (stripeError != null && cleanupError != null) {
            response.setStatusCode(500);
            response.getWriter().write("Both passes failed. Stripe: " + stripeError.getMessage()
                    + "; Cleanup: " + cleanupError.getMessage());
            return;
        }

        response.setStatusCode(200);
        response.getWriter().write("Stripe expired: " + stripeExpired + ", docs deleted: " + deleted + "\n");
        if (stripeError != null) {
            response.getWriter().write("Stripe pass error (cleanup ran): " + stripeError.getMessage() + "\n");
        }
        if (cleanupError != null) {
            response.getWriter().write("Cleanup error (Stripe pass ran): " + cleanupError.getMessage() + "\n");
        }
    }
}
