package com.functions.fulfilment.models.requests;

public record GetFulfilmentEntityInfoRequest(
        String fulfilmentSessionId,
        String fulfilmentEntityId) {
}