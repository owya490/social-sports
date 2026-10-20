package com.functions.fulfilment.models.requests;

import com.functions.fulfilment.models.PaymentProvider;

public record InitCheckoutFulfilmentSessionRequest(
        String eventId,
        Integer numTickets,
        String eventTicketTypeId,
        PaymentProvider paymentProvider) {
    public InitCheckoutFulfilmentSessionRequest {
        if (eventTicketTypeId == null || eventTicketTypeId.isBlank()) {
            throw new IllegalArgumentException("eventTicketTypeId must be provided as a non-empty string.");
        }
    }
}
