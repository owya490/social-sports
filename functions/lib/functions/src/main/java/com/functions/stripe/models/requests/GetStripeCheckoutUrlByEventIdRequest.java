package com.functions.stripe.models.requests;

import java.util.Optional;

public record GetStripeCheckoutUrlByEventIdRequest(
        String eventId,
        Boolean isPrivate,
        Integer quantity,
        String cancelUrl,
        String successUrl,
        Boolean completeFulfilmentSession,
        Optional<String> fulfilmentSessionId,
        Optional<String> endFulfilmentEntityId
) {
}
