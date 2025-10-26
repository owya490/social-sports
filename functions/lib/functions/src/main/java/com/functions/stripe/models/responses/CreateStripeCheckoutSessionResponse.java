package com.functions.stripe.models.responses;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Response model for Stripe checkout session creation.
 * Contains the checkout URL or error URL.
 */
public record CreateStripeCheckoutSessionResponse(
        @JsonProperty("url") String url
) {
}

