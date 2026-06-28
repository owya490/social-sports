package com.functions.fulfilment.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.fulfilment.services.FulfilmentService;
import com.functions.global.controllers.AbstractConfiguredHttpFunction;
import com.functions.utils.logging.RequestLogContext;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

public class CleanupOldFulfilmentSessionsCronEndpoint extends AbstractConfiguredHttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(CleanupOldFulfilmentSessionsCronEndpoint.class);

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        long startNanos = System.nanoTime();
        String statusCode = "500";

        // Set CORS headers for all responses
        response.appendHeader("Access-Control-Allow-Origin", "*");
        response.appendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.appendHeader("Access-Control-Max-Age", "3600"); // Cache preflight for 1 hour

        RequestLogContext logContext =
                RequestLogContext.fromHttpRequest("CleanupOldFulfilmentSessionsCronEndpoint", request).activate();
        try (logContext) {
            logger.info("HTTP request started {}", logContext.format("event", "http_request_start"));

            // Handle preflight (OPTIONS) requests
            if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
                statusCode = "204";
                response.setStatusCode(204); // No Content
                return;
            }

            if (!(request.getMethod().equalsIgnoreCase("GET"))) {
                statusCode = "405";
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
                logger.info("Stripe checkout expiry pass completed {}",
                        logContext.format("event", "stripe_checkout_expiry_pass_completed", "stripeExpiredCount", stripeExpired));
            } catch (Exception e) {
                stripeError = e;
                logger.error("Error during Stripe checkout expiry pass {}",
                        logContext.format("event", "stripe_checkout_expiry_pass_failed"), e);
            }

            try {
                deleted = FulfilmentService.cleanupOldFulfilmentSessions();
                logger.info("Doc cleanup completed {}",
                        logContext.format("event", "fulfilment_session_doc_cleanup_completed", "deletedCount", deleted));
            } catch (Exception e) {
                cleanupError = e;
                logger.error("Error during cleanup of old fulfilment sessions {}",
                        logContext.format("event", "fulfilment_session_doc_cleanup_failed"), e);
            }

            if (stripeError != null && cleanupError != null) {
                statusCode = "500";
                response.setStatusCode(500);
                response.getWriter().write("Both passes failed. Stripe: " + stripeError.getMessage()
                        + "; Cleanup: " + cleanupError.getMessage());
                return;
            }

            statusCode = "200";
            logger.info("Fulfilment cleanup cron completed {}",
                    logContext.format("event", "fulfilment_cleanup_cron_completed",
                            "stripeExpiredCount", stripeExpired, "deletedCount", deleted,
                            "stripeError", stripeError != null, "cleanupError", cleanupError != null));
            response.setStatusCode(200);
            response.getWriter().write("Stripe expired: " + stripeExpired + ", docs deleted: " + deleted + "\n");
            if (stripeError != null) {
                response.getWriter().write("Stripe pass error (cleanup ran): " + stripeError.getMessage() + "\n");
            }
            if (cleanupError != null) {
                response.getWriter().write("Cleanup error (Stripe pass ran): " + cleanupError.getMessage() + "\n");
            }
        } finally {
            long durationMs = (System.nanoTime() - startNanos) / 1_000_000;
            logger.info("HTTP request finished {}",
                    logContext.format("event", "http_request_finish", "statusCode", statusCode, "durationMs", durationMs));
        }
    }
}
