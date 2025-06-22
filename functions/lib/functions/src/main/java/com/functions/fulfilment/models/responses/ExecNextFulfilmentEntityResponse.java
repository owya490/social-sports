package com.functions.fulfilment.models.responses;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

public record ExecNextFulfilmentEntityResponse(
        // Null if there are no more fulfilment entities to process
        @Nullable
        String nextUrl,
        // NOTE: 0 based index of the current fulfilment entity
        @Nonnull
        Integer currentFulfilmentEntityIndex,
        @Nonnull
        Integer numFulfilmentEntities
) {
}
