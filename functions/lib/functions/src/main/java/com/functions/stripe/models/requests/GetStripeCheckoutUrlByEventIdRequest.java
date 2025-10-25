package com.functions.stripe.models.requests;

/**
 * @deprecated Use {@link CreateStripeCheckoutSessionRequest} instead.
 * This model was used when calling Python functions via HTTP.
 * Now that checkout logic is in Java, use the new model.
 * Will be removed in a future release.
 */
@Deprecated(since = "2025-10-25", forRemoval = true)
public record GetStripeCheckoutUrlByEventIdRequest(
        String eventId,
        Boolean isPrivate,
        Integer quantity,
        String cancelUrl,
        String successUrl,
        Boolean completeFulfilmentSession,
        String fulfilmentSessionId,
        String endFulfilmentEntityId
) {
}
