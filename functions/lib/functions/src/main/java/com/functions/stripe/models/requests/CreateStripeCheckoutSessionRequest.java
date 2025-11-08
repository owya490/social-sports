package com.functions.stripe.models.requests;

import java.net.URI;

import javax.annotation.Nonnull;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Request model for creating a Stripe checkout session.
 */
public record CreateStripeCheckoutSessionRequest(
        @JsonProperty("eventId") String eventId,
        @JsonProperty("isPrivate") Boolean isPrivate,
        @JsonProperty("quantity") Integer quantity,
        @JsonProperty("cancelUrl") String cancelUrl,
        @JsonProperty("successUrl") String successUrl,
        @JsonProperty("completeFulfilmentSession") Boolean completeFulfilmentSession,
        @JsonProperty("fulfilmentSessionId") @Nonnull String fulfilmentSessionId,
        @JsonProperty("endFulfilmentEntityId") @Nonnull String endFulfilmentEntityId
) {
    /**
     * Compact constructor that validates all fields at creation time.
     * 
     * @throws IllegalArgumentException if validation fails
     */
    public CreateStripeCheckoutSessionRequest {
        validate(eventId, isPrivate, quantity, cancelUrl, successUrl, completeFulfilmentSession,
                 fulfilmentSessionId, endFulfilmentEntityId);
    }

    /**
     * Validates that all required fields are present and have valid values.
     * 
     * @throws IllegalArgumentException if validation fails
     */
    private static void validate(String eventId, Boolean isPrivate, Integer quantity, 
                                  String cancelUrl, String successUrl, Boolean completeFulfilmentSession,
                                  String fulfilmentSessionId, String endFulfilmentEntityId) {
        if (eventId == null || eventId.isBlank()) {
            throw new IllegalArgumentException("Event ID must be provided as a non-empty string.");
        }
        if (isPrivate == null) {
            throw new IllegalArgumentException("Is Private must be provided as a boolean but was null.");
        }
        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be provided as a positive integer.");
        }
        if (cancelUrl == null || cancelUrl.isBlank()) {
            throw new IllegalArgumentException("Cancel URL must be provided as a non-empty string.");
        }
        try { 
            URI.create(cancelUrl); 
        } catch (Exception e) {
            throw new IllegalArgumentException("Cancel URL must be a valid URI.", e);
        }
        if (successUrl == null || successUrl.isBlank()) {
            throw new IllegalArgumentException("Success URL must be provided as a non-empty string.");
        }
        try { 
            URI.create(successUrl); 
        } catch (Exception e) {
            throw new IllegalArgumentException("Success URL must be a valid URI.", e);
        }
        if (completeFulfilmentSession == null) {
            throw new IllegalArgumentException("Complete Fulfilment Session must be provided as a boolean but was null.");
        }
        if (fulfilmentSessionId == null || fulfilmentSessionId.isBlank()) {
            throw new IllegalArgumentException("Fulfilment Session ID must be provided as a non-empty string.");
        }
        if (endFulfilmentEntityId == null || endFulfilmentEntityId.isBlank()) {
            throw new IllegalArgumentException("End Fulfilment Entity ID must be provided as a non-empty string.");
        }
    }
}

