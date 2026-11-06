package com.functions.fulfilment.models.requests;

public record InitPartnerFulfilmentSessionRequest(String eventId, String eventTicketTypeId, Integer numTickets) {
    public InitPartnerFulfilmentSessionRequest {
        if (eventId == null || eventId.isBlank() || eventTicketTypeId == null || eventTicketTypeId.isBlank()
                || numTickets == null || numTickets <= 0) {
            throw new IllegalArgumentException("Invalid request data");
        }
    }
}
