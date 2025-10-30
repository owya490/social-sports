package com.functions.stripe.models.requests;

import java.net.URI;

import javax.annotation.Nullable;

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
        @JsonProperty("fulfilmentSessionId") @Nullable String fulfilmentSessionId,
        @JsonProperty("endFulfilmentEntityId") @Nullable String endFulfilmentEntityId
) {
    /**
     * Validates that all required fields are present and have valid values.
     * 
     * @throws IllegalArgumentException if validation fails
     */
    public void validate() {
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
        try { URI.create(cancelUrl); } catch (Exception e) {
            throw new IllegalArgumentException("Cancel URL must be a valid URI.", e);
        }
        if (successUrl == null || successUrl.isBlank()) {
            throw new IllegalArgumentException("Success URL must be provided as a non-empty string.");
        }
        try { URI.create(successUrl); } catch (Exception e) {
            throw new IllegalArgumentException("Success URL must be a valid URI.", e);
        }
        if (completeFulfilmentSession == null) {
            throw new IllegalArgumentException("Complete Fulfilment Session must be provided as a boolean but was null.");
        }
    }
}

