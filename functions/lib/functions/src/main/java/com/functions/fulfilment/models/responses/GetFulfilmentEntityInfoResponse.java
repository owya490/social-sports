package com.functions.fulfilment.models.responses;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

import com.functions.fulfilment.models.FulfilmentEntityType;

public record GetFulfilmentEntityInfoResponse(
        @Nonnull FulfilmentEntityType type,
        /**
         * Url of the specified fulfilment entity, if applicable.
         */
        @Nullable String url) {
}