package com.functions.global.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.fulfilment.exceptions.FulfilmentEntityNotFoundException;
import com.functions.fulfilment.exceptions.FulfilmentProgressionBlockedException;
import com.functions.fulfilment.exceptions.FulfilmentSessionNotFoundException;
import com.functions.global.handlers.HandlerRegistry;
import com.functions.global.models.EndpointType;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.global.models.responses.ErrorResponse;
import com.functions.global.models.responses.UnifiedResponse;
import com.functions.stripe.exceptions.CheckoutDateTimeException;
import com.functions.stripe.exceptions.CheckoutVacancyException;
import com.functions.stripe.handlers.StripeWebhookHandler;
import com.functions.utils.JavaUtils;
import com.functions.utils.logging.RequestLogContext;
import com.functions.utils.logging.StatusTrackingHttpResponse;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

/**
 * Unified endpoint that routes requests to specific handlers based on the endpoint type.
 * <p>
 * This provides a single entry point for all function calls while maintaining type safety.
 */
public class GlobalAppController extends AbstractConfiguredHttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(GlobalAppController.class);

    @FunctionalInterface
    interface StripeWebhookProcessor {
        void handle(HttpRequest request, HttpResponse response) throws Exception;
    }

    private final StripeWebhookProcessor stripeWebhookProcessor;

    public GlobalAppController() {
        this(StripeWebhookHandler::handleWebhook);
    }

    GlobalAppController(StripeWebhookProcessor stripeWebhookProcessor) {
        this.stripeWebhookProcessor = stripeWebhookProcessor;
    }

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        setResponseHeaders(response);

        long startNanos = System.nanoTime();
        String statusCode = "500";

        try (RequestLogContext logContext =
                RequestLogContext.fromHttpRequest("GlobalAppController", request).activate()) {
            logger.info("HTTP request started {}", logContext.format("event", "http_request_start"));

            try {
                // Handle preflight (OPTIONS) requests
                if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
                    statusCode = "204";
                    response.setStatusCode(204); // No Content
                    return;
                }

                if (shouldRouteToStripeWebhook(request)) {
                    statusCode = handleStripeWebhook(request, response, logContext, stripeWebhookProcessor);
                    return;
                }

                if (!"POST".equalsIgnoreCase(request.getMethod())) {
                    statusCode = "405";
                    response.setStatusCode(405); // Method Not Allowed
                    response.appendHeader("Allow", "POST");
                    response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                            new ErrorResponse("The GlobalAppController only supports POST requests.")));
                    return;
                }

                UnifiedRequest unifiedRequest;
                try {
                    unifiedRequest =
                            JavaUtils.objectMapper.readValue(request.getReader(), UnifiedRequest.class);
                } catch (Exception e) {
                    statusCode = "400";
                    response.setStatusCode(400); // Bad Request
                    logger.error("Could not parse request input {}", logContext.format("event", "request_parse_failed"), e);
                    response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                            new ErrorResponse("Invalid request data: " + e.getMessage())));
                    return;
                }

                if (unifiedRequest.endpointType() == null || unifiedRequest.data() == null) {
                    statusCode = "400";
                    response.setStatusCode(400);
                    response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                            new ErrorResponse("Both endpointType and data are required.")));
                    return;
                }

                logContext.withField("endpointType", unifiedRequest.endpointType());
                Object result = routeRequest(unifiedRequest, logContext);

                statusCode = "200";
                response.setStatusCode(200);
                response.getWriter().write(
                        JavaUtils.objectMapper.writeValueAsString(UnifiedResponse.success(result)));

            } catch (FulfilmentProgressionBlockedException e) {
                statusCode = "400";
                logger.warn("Fulfilment progression blocked {}", logContext.format("event", "request_rejected", "reason", e.getMessage()));
                response.setStatusCode(400);
                response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                        new ErrorResponse(e.getMessage())));
            } catch (IllegalArgumentException e) {
                statusCode = "400";
                logger.warn("Bad request {}", logContext.format("event", "bad_request", "reason", e.getMessage()));
                response.setStatusCode(400);
                response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                        new ErrorResponse(e.getMessage())));
            } catch (FulfilmentEntityNotFoundException e) {
                statusCode = "404";
                logger.warn("Resource not found {}", logContext.format("event", "resource_not_found", "reason", e.getMessage()));
                response.setStatusCode(404);
                response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                        new ErrorResponse(e.getMessage())));
            } catch (FulfilmentSessionNotFoundException e) {
                statusCode = "404";
                logger.warn("Resource not found {}", logContext.format("event", "resource_not_found", "reason", e.getMessage()));
                response.setStatusCode(404);
                response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                        new ErrorResponse(e.getMessage())));
            } catch (CheckoutVacancyException e) {
                statusCode = "400";
                logger.warn("Checkout vacancy error {}", logContext.format("event", "checkout_vacancy_error", "reason", e.getMessage()));
                response.setStatusCode(400);
                response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                        new ErrorResponse("Checkout vacancy error: " + e.getMessage())));
            } catch (CheckoutDateTimeException e) {
                statusCode = "400";
                logger.warn("Checkout date time error {}", logContext.format("event", "checkout_datetime_error", "reason", e.getMessage()));
                response.setStatusCode(400);
                response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                        new ErrorResponse("Checkout date time error: " + e.getMessage())));
            } catch (Exception e) {
                statusCode = "500";
                logger.error("Error processing request {}", logContext.format("event", "request_failed"), e);
                response.setStatusCode(500);
                response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                        new ErrorResponse("Internal server error")));
            } finally {
                long durationMs = (System.nanoTime() - startNanos) / 1_000_000;
                logger.info("HTTP request finished {}",
                        logContext.format("event", "http_request_finish", "statusCode", statusCode, "durationMs", durationMs));
            }
        }
    }

    private Object routeRequest(UnifiedRequest unifiedRequest, RequestLogContext logContext) throws Exception {
        EndpointType endpointType = unifiedRequest.endpointType();

        if (!HandlerRegistry.hasHandler(endpointType)) {
            throw new IllegalArgumentException("No handler registered for endpoint type: " + endpointType);
        }

        var handler = HandlerRegistry.getHandler(endpointType);
        return handler.handle(handler.parse(unifiedRequest), logContext);
    }

    static boolean shouldRouteToStripeWebhook(HttpRequest request) {
        return "POST".equalsIgnoreCase(request.getMethod())
                && request.getFirstHeader("Stripe-Signature")
                        .map(signature -> !signature.trim().isEmpty())
                        .orElse(false);
    }

    static void handleStripeWebhook(HttpRequest request, HttpResponse response) throws Exception {
        try (RequestLogContext logContext =
                RequestLogContext.fromHttpRequest("GlobalAppController", request)
                        .withField("route", "stripeWebhook")
                        .activate()) {
            handleStripeWebhookWithStatus(request, response, logContext, StripeWebhookHandler::handleWebhook);
        }
    }

    static void handleStripeWebhook(
            HttpRequest request,
            HttpResponse response,
            StripeWebhookProcessor stripeWebhookProcessor) throws Exception {
        RequestLogContext logContext = RequestLogContext.current().withField("route", "stripeWebhook");
        handleStripeWebhookWithStatus(request, response, logContext, stripeWebhookProcessor);
    }

    static String handleStripeWebhook(
            HttpRequest request,
            HttpResponse response,
            RequestLogContext logContext) throws Exception {
        return handleStripeWebhook(request, response, logContext, StripeWebhookHandler::handleWebhook);
    }

    static String handleStripeWebhook(
            HttpRequest request,
            HttpResponse response,
            RequestLogContext logContext,
            StripeWebhookProcessor stripeWebhookProcessor) throws Exception {
        return handleStripeWebhookWithStatus(
                request,
                response,
                logContext.withField("route", "stripeWebhook"),
                stripeWebhookProcessor);
    }

    static String handleStripeWebhookWithStatus(
            HttpRequest request,
            HttpResponse response,
            RequestLogContext logContext,
            StripeWebhookProcessor stripeWebhookProcessor) throws Exception {
        logger.info("Detected Stripe webhook request {}", logContext.format("event", "stripe_webhook_route"));
        StatusTrackingHttpResponse trackingResponse = new StatusTrackingHttpResponse(response, 200);
        try {
            stripeWebhookProcessor.handle(request, trackingResponse);
        } catch (Exception e) {
            logger.error("Unhandled exception while processing Stripe webhook {}",
                    logContext.format("event", "stripe_webhook_unhandled_exception"), e);
            trackingResponse.setStatusCode(500);
            trackingResponse.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse("Internal server error")));
        }
        return trackingResponse.getStatusCodeString();
    }

    private void setResponseHeaders(HttpResponse response) {
        response.appendHeader("Access-Control-Allow-Origin", "*");
        response.appendHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.appendHeader("Access-Control-Max-Age", "3600"); // Cache preflight for 1 hour
        response.appendHeader("Content-Type", "application/json; charset=UTF-8");
    }
}
