package com.functions.stripe.models.responses;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Response model for Stripe checkout session creation.
 * Contains the checkout URL and (when created via Java CheckoutService) ids for cron-driven expiry.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record CreateStripeCheckoutSessionResponse(
        @JsonProperty("url") String url,
        @JsonProperty("stripeCheckoutSessionId") String stripeCheckoutSessionId,
        @JsonProperty("stripeAccountId") String stripeAccountId
) {
}
