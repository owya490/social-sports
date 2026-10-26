package com.functions.fulfilment.models.requests;

public record UpdateFulfilmentPurchaserRequest(
        String fulfilmentSessionId,
        String fulfilmentEntityId,
        String name,
        String email) {
}
