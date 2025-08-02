package com.functions.fulfilment.models.requests;

public record GetNextFulfilmentEntityRequest(
        String fulfilmentSessionId,
        String currentFulfilmentEntityId) {
}
