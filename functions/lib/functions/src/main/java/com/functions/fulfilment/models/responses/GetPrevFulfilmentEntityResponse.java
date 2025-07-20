package com.functions.fulfilment.models.responses;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

import com.functions.fulfilment.models.FulfilmentEntityType;

public record GetPrevFulfilmentEntityResponse(
        @Nonnull FulfilmentEntityType type,
        /**
         * Null if there are no previous fulfilment entities.
         */
        @Nullable String fulfilmentEntityId,
        /**
         * Url of the previous fulfilment entity, if applicable.
         */
        @Nullable String url) {
}
