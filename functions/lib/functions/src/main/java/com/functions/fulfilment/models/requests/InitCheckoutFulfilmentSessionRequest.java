package com.functions.fulfilment.models.requests;

public record InitCheckoutFulfilmentSessionRequest(
        String eventId,
        Integer numTickets
){}
