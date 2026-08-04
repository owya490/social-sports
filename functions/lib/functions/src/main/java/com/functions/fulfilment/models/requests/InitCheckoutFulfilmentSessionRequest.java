package com.functions.fulfilment.models.requests;

public record InitCheckoutFulfilmentSessionRequest(
        String eventId,
        Integer numTickets,
        String eventTicketTypeId) {
    public InitCheckoutFulfilmentSessionRequest {
        if (eventTicketTypeId == null || eventTicketTypeId.isBlank()) {
            throw new IllegalArgumentException("eventTicketTypeId must be provided as a non-empty string.");
        }
    }
}
