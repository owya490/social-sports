package com.functions.fulfilment.models.responses;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntityType;

// TODO: refactor this in a way where we don't have to overload this one response model with all information
// from all different fulfilment entity types.
public record GetFulfilmentEntityInfoResponse(
                @Nonnull FulfilmentEntityType type,
                /**
                 * Url of the specified fulfilment entity, if applicable.
                 */
                @Nullable String url,

                /**
                 * Forms specific fields.
                 */
                @Nullable String eventId,
                @Nullable String formId,
                @Nullable String formResponseId) {
}