package com.functions.fulfilment.models.requests;

import javax.annotation.Nullable;

public record GetNextFulfilmentEntityRequest(
        String fulfilmentSessionId,
        @Nullable String currentFulfilmentEntityId) {
}
