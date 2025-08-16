package com.functions.fulfilment.models.requests;

public record CompleteFulfilmentSessionRequest(
        String fulfilmentSessionId,
        /**
         * Should be the fulfilment entity ID of an entity of `END` type.
         * Otherwise, the endpoint will return unsuccessful response.
         */
        String fulfilmentEntityId) {
}
