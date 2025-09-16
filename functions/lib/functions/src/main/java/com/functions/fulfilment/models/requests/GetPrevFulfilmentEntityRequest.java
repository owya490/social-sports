package com.functions.fulfilment.models.requests;

public record GetPrevFulfilmentEntityRequest(
        String fulfilmentSessionId,
        String currentFulfilmentEntityId) {
}
