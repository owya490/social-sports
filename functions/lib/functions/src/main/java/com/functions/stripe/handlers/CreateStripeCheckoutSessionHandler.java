package com.functions.stripe.handlers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.stripe.models.requests.CreateStripeCheckoutSessionRequest;
import com.functions.stripe.models.responses.CreateStripeCheckoutSessionResponse;
import com.functions.stripe.services.CheckoutService;
import com.functions.utils.JavaUtils;

/**
 * Handler for creating Stripe checkout sessions.
 * Integrates with GlobalAppController for unified routing.
 */
public class CreateStripeCheckoutSessionHandler 
        implements Handler<CreateStripeCheckoutSessionRequest, CreateStripeCheckoutSessionResponse> {

    private static final Logger logger = LoggerFactory.getLogger(CreateStripeCheckoutSessionHandler.class);

    @Override
    public CreateStripeCheckoutSessionRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), CreateStripeCheckoutSessionRequest.class);
        } catch (JsonProcessingException e) {
            logger.error("Failed to parse CreateStripeCheckoutSessionRequest", e);
            throw new RuntimeException("Failed to parse CreateStripeCheckoutSessionRequest", e);
        }
    }

    @Override
    public CreateStripeCheckoutSessionResponse handle(CreateStripeCheckoutSessionRequest parsedRequestData) {
        try {
            // Validate request
            parsedRequestData.validate();
            
            logger.info("Creating Stripe checkout session for event: {}, quantity: {}, isPrivate: {}",
                    parsedRequestData.eventId(), parsedRequestData.quantity(), parsedRequestData.isPrivate());

            // Create checkout session via CheckoutService
            CreateStripeCheckoutSessionResponse response = CheckoutService.createStripeCheckoutSession(parsedRequestData);

            logger.info("Successfully created checkout session for event: {}, URL: {}",
                    parsedRequestData.eventId(), response.url());

            return response;
        } catch (IllegalArgumentException e) {
            logger.warn("Validation error for checkout session: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Error creating checkout session for event: {}", parsedRequestData.eventId(), e);
            throw new RuntimeException("Failed to create checkout session", e);
        }
    }
}

