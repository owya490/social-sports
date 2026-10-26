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
                @Nullable String formResponseId,
                /**
                 * Hosted Pyng checkout. The entity url stays on the fulfilment page.
                 */
                @Nullable String checkoutUrl,
                /**
                 * Order summary for the details step.
                 */
                @Nullable Integer quantity,
                @Nullable String ticketName,
                @Nullable Integer unitPriceCents) {
}
