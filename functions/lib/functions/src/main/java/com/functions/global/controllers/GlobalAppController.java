package com.functions.global.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.fulfilment.exceptions.FulfilmentEntityNotFoundException;
import com.functions.fulfilment.exceptions.FulfilmentProgressionBlockedException;
import com.functions.fulfilment.exceptions.FulfilmentSessionNotFoundException;
import com.functions.global.exceptions.AuthenticationException;
import com.functions.global.exceptions.AuthorizationException;
import com.functions.global.handlers.HandlerRegistry;
import com.functions.global.models.AuthContext;
import com.functions.global.models.EndpointType;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.global.models.responses.ErrorResponse;
import com.functions.global.models.responses.UnifiedResponse;
import com.functions.global.services.AuthService;
import com.functions.stripe.config.StripeConfig;
import com.functions.stripe.exceptions.CheckoutDateTimeException;
import com.functions.stripe.exceptions.CheckoutVacancyException;
import com.functions.utils.JavaUtils;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

/**
 * Unified endpoint that routes requests to specific handlers based on the endpoint type.
 * <p>
 * This provides a single entry point for all function calls while maintaining type safety.
 */
public class GlobalAppController implements HttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(GlobalAppController.class);

    public GlobalAppController() {
        StripeConfig.initialize();
    }

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        setResponseHeaders(response);

        // Handle preflight (OPTIONS) requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatusCode(204); // No Content
            return;
        }

        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            response.setStatusCode(405); // Method Not Allowed
            response.appendHeader("Allow", "POST");
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse("The GlobalAppController only supports POST requests.")));
            return;
        }

        try {
            UnifiedRequest unifiedRequest;
            try {
                unifiedRequest =
                        JavaUtils.objectMapper.readValue(request.getReader(), UnifiedRequest.class);
            } catch (Exception e) {
                response.setStatusCode(400); // Bad Request
                logger.error("Could not parse request input:", e);
                response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                        new ErrorResponse("Invalid request data: " + e.getMessage())));
                return;
            }

            if (unifiedRequest.endpointType() == null || unifiedRequest.data() == null) {
                response.setStatusCode(400);
                response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                        new ErrorResponse("Both endpointType and data are required.")));
                return;
            }

            AuthContext authContext = AuthService.verify(request, unifiedRequest.endpointType().getAuthLevel());
            Object result = routeRequest(unifiedRequest, authContext);

            response.setStatusCode(200);
            response.getWriter().write(
                    JavaUtils.objectMapper.writeValueAsString(UnifiedResponse.success(result)));

        } catch (AuthenticationException e) {
            logger.warn("Authentication failed: {}", e.getMessage());
            response.setStatusCode(401);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse(e.getMessage())));
        } catch (AuthorizationException e) {
            logger.warn("Authorization failed: {}", e.getMessage());
            response.setStatusCode(403);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse(e.getMessage())));
        } catch (FulfilmentProgressionBlockedException e) {
            logger.warn("Fulfilment progression blocked: {}", e.getMessage());
            response.setStatusCode(400);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse(e.getMessage())));
        } catch (IllegalArgumentException e) {
            logger.warn("Bad request: {}", e.getMessage());
            response.setStatusCode(400);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse(e.getMessage())));
        } catch (FulfilmentEntityNotFoundException e) {
            logger.warn("Resource not found: {}", e.getMessage());
            response.setStatusCode(404);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse(e.getMessage())));
        } catch (FulfilmentSessionNotFoundException e) {
            logger.warn("Resource not found: {}", e.getMessage());
            response.setStatusCode(404);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse(e.getMessage())));
        } catch (CheckoutVacancyException e) {
            logger.warn("Checkout vacancy error: {}", e.getMessage());
            response.setStatusCode(400);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse("Checkout vacancy error: " + e.getMessage())));
        } catch (CheckoutDateTimeException e) {
            logger.warn("Checkout date time error: {}", e.getMessage());
            response.setStatusCode(400);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse("Checkout date time error: " + e.getMessage())));
        } catch (Exception e) {
            logger.error("Error processing request", e);
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

    private void setResponseHeaders(HttpResponse response) {
        response.appendHeader("Access-Control-Allow-Origin", "*");
        response.appendHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Session-Secret");
        response.appendHeader("Access-Control-Max-Age", "3600"); // Cache preflight for 1 hour
        response.appendHeader("Content-Type", "application/json; charset=UTF-8");
    }
}
