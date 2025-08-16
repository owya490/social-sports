package com.functions.fulfilment.models.requests;

import javax.annotation.Nullable;

public record GetFulfilmentSessionInfoRequest(
        String fulfilmentSessionId,
        @Nullable String currentFulfilmentEntityId) {
}
