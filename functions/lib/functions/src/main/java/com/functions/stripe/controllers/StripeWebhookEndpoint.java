package com.functions.stripe.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.global.controllers.AbstractConfiguredHttpFunction;
import com.functions.global.models.responses.ErrorResponse;
import com.functions.stripe.handlers.StripeWebhookHandler;
import com.functions.utils.JavaUtils;
import com.functions.utils.logging.RequestLogContext;
import com.functions.utils.logging.StatusTrackingHttpResponse;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

public class StripeWebhookEndpoint extends AbstractConfiguredHttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(StripeWebhookEndpoint.class);

    @FunctionalInterface
    interface StripeWebhookProcessor {
        void handle(HttpRequest request, HttpResponse response) throws Exception;
    }

    private final StripeWebhookProcessor stripeWebhookProcessor;

    public StripeWebhookEndpoint() {
        this(StripeWebhookHandler::handleWebhook);
    }

    StripeWebhookEndpoint(StripeWebhookProcessor stripeWebhookProcessor) {
        this.stripeWebhookProcessor = stripeWebhookProcessor;
    }

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        setResponseHeaders(response);

        long startNanos = System.nanoTime();
        String statusCode = "200";

        try (RequestLogContext logContext =
                RequestLogContext.fromHttpRequest("StripeWebhookEndpoint", request).activate()) {
            logger.info("HTTP request started {}", logContext.format("event", "http_request_start"));

            StatusTrackingHttpResponse trackingResponse = new StatusTrackingHttpResponse(response, 200);
            try {
                if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
                    statusCode = "204";
                    response.setStatusCode(204);
                    return;
                }

                logger.info("Routing Stripe webhook request {}", logContext.format("event", "stripe_webhook_route"));
                stripeWebhookProcessor.handle(request, trackingResponse);
                statusCode = trackingResponse.getStatusCodeString();
            } catch (Exception e) {
                statusCode = "500";
                logger.error("Unhandled exception while processing Stripe webhook {}",
                        logContext.format("event", "stripe_webhook_unhandled_exception"), e);
                trackingResponse.setStatusCode(500);
                trackingResponse.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                        new ErrorResponse("Internal server error")));
            } finally {
                long durationMs = (System.nanoTime() - startNanos) / 1_000_000;
                logger.info("HTTP request finished {}",
                        logContext.format("event", "http_request_finish", "statusCode", statusCode, "durationMs", durationMs));
            }
        }
    }

    private void setResponseHeaders(HttpResponse response) {
        response.appendHeader("Content-Type", "application/json; charset=UTF-8");
    }
}
