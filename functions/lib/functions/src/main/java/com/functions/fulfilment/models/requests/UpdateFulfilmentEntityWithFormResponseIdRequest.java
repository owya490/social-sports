package com.functions.fulfilment.models.requests;

public record UpdateFulfilmentEntityWithFormResponseIdRequest(
        String fulfilmentSessionId,
        String fulfilmentEntityId,
        String formResponseId) {

}
