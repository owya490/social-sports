package com.functions.stripe.models.requests;

public record GetStripeCheckoutUrlByEventIdRequest(
        String eventId,
        Boolean isPrivate,
        Integer numTickets,
        String cancelUrl,
        String successUrl
) {
}
