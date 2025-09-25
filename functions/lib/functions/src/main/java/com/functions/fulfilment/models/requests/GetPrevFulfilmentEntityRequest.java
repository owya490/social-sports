package com.functions.fulfilment.models.requests;

import javax.annotation.Nullable;

public record GetPrevFulfilmentEntityRequest(
        String fulfilmentSessionId,
        @Nullable String currentFulfilmentEntityId) {
}
