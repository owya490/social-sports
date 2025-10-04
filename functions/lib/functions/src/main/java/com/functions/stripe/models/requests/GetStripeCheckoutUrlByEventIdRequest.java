package com.functions.stripe.models.requests;

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
