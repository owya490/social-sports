package com.functions.fullfilment.models.requests;

import java.util.List;

public record InitCheckoutFulfilmentSessionRequest(
        String eventId,
        Integer numTickets,
        List<String> fulfilmentEntityTypes,
        String endUrl
){}
