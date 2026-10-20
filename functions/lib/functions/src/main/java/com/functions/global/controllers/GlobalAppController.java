package com.functions.global.controllers;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.event.Level;

import com.fasterxml.jackson.databind.JsonNode;
import com.functions.fulfilment.exceptions.FulfilmentProgressionBlockedException;
import com.functions.global.exceptions.AuthenticationException;
import com.functions.global.exceptions.AuthorizationException;
import com.functions.global.exceptions.NotFoundException;
import com.functions.global.handlers.HandlerRegistry;
import com.functions.global.models.AuthContext;
import com.functions.global.models.AuthLevel;
import com.functions.global.models.EndpointType;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.global.models.responses.ErrorResponse;
import com.functions.global.models.responses.UnifiedResponse;
import com.functions.global.services.AuthService;
import com.functions.stripe.exceptions.CheckoutDateTimeException;
import com.functions.stripe.exceptions.CheckoutVacancyException;
import com.functions.tickets.exceptions.OrderStatusConflictException;
import com.functions.utils.JavaUtils;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

/**
 * Unified endpoint that routes requests to specific handlers based on the endpoint type.
 * <p>
 * This provides a single entry point for all function calls while maintaining type safety.
 */
public class GlobalAppController extends AbstractConfiguredHttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(GlobalAppController.class);

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        setCommonHeaders(response);

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            setWildcardOrigin(response);
            response.setStatusCode(204);
            return;
        }

        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            setWildcardOrigin(response);
            response.setStatusCode(405); // Method Not Allowed
            response.appendHeader("Allow", "POST");
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse("The GlobalAppController only supports POST requests.")));
            return;
        }

        EndpointType endpointType = null;
        AuthContext authContext = null;
        try {
            JsonNode envelope;
            try {
                envelope = JavaUtils.objectMapper.readTree(request.getReader());
                JsonNode endpoint = envelope == null ? null : envelope.get("endpointType");
                if (endpoint != null) {
                    if (!endpoint.isTextual()) {
                        throw new IllegalArgumentException("Invalid endpointType");
                    }
                    endpointType = EndpointType.valueOf(endpoint.textValue());
                }
            } catch (Exception e) {
                setWildcardOrigin(response);
                respondInvalidRequest(endpointType, null, response);
                return;
            }

            if (isPartner(endpointType)) {
                response.appendHeader("Cache-Control", "no-store");
                authContext = AuthService.verify(request, endpointType.getAuthLevel());
                response.appendHeader("Access-Control-Allow-Origin", authContext.requirePartner().verifiedOrigin());
                response.appendHeader("Vary", "Origin");
            } else {
                setWildcardOrigin(response);
            }
            UnifiedRequest unifiedRequest;
            try {
                unifiedRequest = JavaUtils.objectMapper.treeToValue(envelope, UnifiedRequest.class);
            } catch (Exception e) {
                respondInvalidRequest(endpointType, authContext, response);
                return;
            }
            endpointType = unifiedRequest == null ? endpointType : unifiedRequest.endpointType();
            if (unifiedRequest == null || unifiedRequest.endpointType() == null || unifiedRequest.data() == null) {
                response.setStatusCode(400);
                response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                        new ErrorResponse("Both endpointType and data are required.")));
                return;
            }

            if (authContext == null) {
                authContext = AuthService.verify(request, endpointType.getAuthLevel());
            }
            Object result = routeRequest(unifiedRequest, authContext);

            response.setStatusCode(200);
            response.getWriter().write(
                    JavaUtils.objectMapper.writeValueAsString(UnifiedResponse.success(result)));

        } catch (AuthenticationException e) {
            logRequestFailure(endpointType, authContext, "authentication_denied", "Authentication failed", e);
            response.setStatusCode(401);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse(isPartner(endpointType) ? "Invalid partner key" : e.getMessage())));
        } catch (AuthorizationException e) {
            logRequestFailure(endpointType, authContext, "origin_denied", "Authorization failed", e);
            response.setStatusCode(403);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse(isPartner(endpointType) ? "Partner origin is not allowed" : e.getMessage())));
        } catch (OrderStatusConflictException e) {
            logRequestFailure(endpointType, authContext, "order_conflict", "Order status conflict", e);
            response.setStatusCode(409);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse(isPartner(endpointType) ? "Order status conflict" : e.getMessage())));
        } catch (FulfilmentProgressionBlockedException e) {
            logRequestFailure(endpointType, authContext, "fulfilment_blocked", "Fulfilment progression blocked", e);
            response.setStatusCode(400);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse(isPartner(endpointType) ? "Invalid request data" : e.getMessage())));
        } catch (IllegalArgumentException e) {
            logRequestFailure(endpointType, authContext, "invalid_request", "Bad request", e);
            response.setStatusCode(400);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse(isPartner(endpointType) ? "Invalid request data" : e.getMessage())));
        } catch (NotFoundException e) {
            logRequestFailure(endpointType, authContext, "not_found", "Resource not found", e);
            response.setStatusCode(404);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse(isPartner(endpointType) ? "Event is not available" : e.getMessage())));
        } catch (CheckoutVacancyException e) {
            logRequestFailure(endpointType, authContext, "checkout_vacancy", "Checkout vacancy error", e);
            response.setStatusCode(400);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse(isPartner(endpointType) ? "Invalid request data"
                            : "Checkout vacancy error: " + e.getMessage())));
        } catch (CheckoutDateTimeException e) {
            logRequestFailure(endpointType, authContext, "checkout_date_time", "Checkout date time error", e);
            response.setStatusCode(400);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse(isPartner(endpointType) ? "Invalid request data"
                            : "Checkout date time error: " + e.getMessage())));
        } catch (Exception e) {
            if (isPartner(endpointType)) {
                logOutcome(endpointType, authContext, Level.ERROR, "server_error");
            } else {
                logger.error("Error processing request", e);
            }
            response.setStatusCode(500);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse("Internal server error")));
        }
    }

    private Object routeRequest(UnifiedRequest unifiedRequest, AuthContext authContext) throws Exception {
        EndpointType endpointType = unifiedRequest.endpointType();

        if (!HandlerRegistry.hasHandler(endpointType)) {
            throw new IllegalArgumentException("No handler registered for endpoint type: " + endpointType);
        }

        var handler = HandlerRegistry.getHandler(endpointType);
        return handler.handle(handler.parse(unifiedRequest), authContext);
    }

    private static boolean isPartner(EndpointType endpointType) {
        return endpointType != null && endpointType.getAuthLevel() == AuthLevel.PARTNER;
    }

    private static void respondInvalidRequest(EndpointType endpointType, AuthContext authContext,
            HttpResponse response) throws IOException {
        response.setStatusCode(400);
        logOutcome(endpointType, authContext, Level.WARN, "invalid_request");
        response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(new ErrorResponse("Invalid request data")));
    }

    private static void logRequestFailure(EndpointType endpointType, AuthContext authContext, String outcome,
            String legacyDescription, Exception failure) {
        if (isPartner(endpointType)) {
            logOutcome(endpointType, authContext, Level.WARN, outcome);
        } else {
            logger.warn("{}: {}", legacyDescription, failure.getMessage());
        }
    }

    private static void logOutcome(EndpointType endpointType, AuthContext authContext, Level level, String outcome) {
        String integrationId = authContext != null && authContext.level() == AuthLevel.PARTNER
                ? authContext.requirePartner().integrationId() : null;
        logger.atLevel(level).log("Request endpoint={} outcome={} integrationId={}", endpointType, outcome, integrationId);
    }

    private static void setWildcardOrigin(HttpResponse response) {
        response.appendHeader("Access-Control-Allow-Origin", "*");
    }

    private void setCommonHeaders(HttpResponse response) {
        response.appendHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Sportshub-Partner-Key");
        response.appendHeader("Access-Control-Max-Age", "3600"); // Cache preflight for 1 hour
        response.appendHeader("Content-Type", "application/json; charset=UTF-8");
    }
}
