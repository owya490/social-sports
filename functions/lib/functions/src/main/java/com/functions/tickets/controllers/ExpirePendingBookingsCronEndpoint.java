package com.functions.tickets.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.global.controllers.AbstractConfiguredHttpFunction;
import com.functions.tickets.services.BookingApprovalService;
import com.functions.tickets.services.BookingApprovalService.ExpirePendingOrdersResult;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

/**
 * Cron endpoint that automatically expires PENDING booking-approval orders
 * whose {@code datePurchased} is older than 48 hours.
 *
 * <p>Designed to be triggered by Cloud Scheduler every 15 minutes.
 * Returns HTTP 200 with a JSON-like summary of {@code checked}, {@code expired},
 * and {@code errors} counts for observability.
 */
public class ExpirePendingBookingsCronEndpoint extends AbstractConfiguredHttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(ExpirePendingBookingsCronEndpoint.class);

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        response.appendHeader("Access-Control-Allow-Origin", "*");
        response.appendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.appendHeader("Access-Control-Max-Age", "3600");

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            logger.info("Handling OPTIONS request: {}", request);
            response.setStatusCode(204);
            return;
        }

        if (!request.getMethod().equalsIgnoreCase("GET")) {
            response.setStatusCode(405);
            response.appendHeader("Allow", "GET");
            response.getWriter().write(
                    "The ExpirePendingBookingsCronEndpoint only supports GET requests.");
            return;
        }

        ExpirePendingOrdersResult result = null;
        Throwable expireError = null;

        try {
            result = BookingApprovalService.expirePendingOrders();
            logger.info("Expire pending bookings pass complete. checked={}, expired={}, errors={}",
                    result.checked(), result.expired(), result.errors());
        } catch (Exception e) {
            expireError = e;
            logger.error("Error during expire pending bookings pass", e);
        }

        if (expireError != null) {
            response.setStatusCode(500);
            response.getWriter().write("Expire pending bookings pass failed: " + expireError.getMessage());
            return;
        }

        response.setStatusCode(200);
        response.getWriter().write(String.format(
                "{\"checked\":%d,\"expired\":%d,\"errors\":%d}",
                result.checked(), result.expired(), result.errors()));
    }
}
