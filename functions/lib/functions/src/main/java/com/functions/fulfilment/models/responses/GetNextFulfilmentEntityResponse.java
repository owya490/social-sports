package com.functions.fulfilment.models.responses;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

import com.functions.fulfilment.models.FulfilmentEntityType;

public record GetNextFulfilmentEntityResponse(
        @Nonnull FulfilmentEntityType type,
        /**
         * Null if there are no more fulfilment entities.
         */
        @Nullable String fulfilmentEntityId,
        /**
         * Url of the next fulfilment entity, if applicable.
         */
        @Nullable String url
) {
}
