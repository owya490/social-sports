package com.functions.stripe.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.global.controllers.AbstractConfiguredHttpFunction;
import com.functions.global.models.responses.ErrorResponse;
import com.functions.stripe.handlers.StripeWebhookHandler;
import com.functions.utils.JavaUtils;
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

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatusCode(204);
            return;
        }

        try {
            logger.info("Routing Stripe webhook request to StripeWebhookHandler");
            stripeWebhookProcessor.handle(request, response);
        } catch (Exception e) {
            logger.error("Unhandled exception while processing Stripe webhook. uri={}", request.getUri(), e);
            response.setStatusCode(500);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse("Internal server error")));
        }
    }

    private void setResponseHeaders(HttpResponse response) {
        response.appendHeader("Content-Type", "application/json; charset=UTF-8");
    }
}
