package com.functions.stripe.models.responses;

/**
 * @deprecated Use {@link CreateStripeCheckoutSessionResponse} instead.
 * This model was used when calling Python functions via HTTP.
 * Now that checkout logic is in Java, use the new model.
 * Will be removed in a future release.
 */
@Deprecated(since = "2025-10-25", forRemoval = true)
public record GetStripeCheckoutUrlByEventIdResponse(
        String url
) {
}
