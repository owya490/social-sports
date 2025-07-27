package com.functions.fulfilment.models.responses;

import javax.annotation.Nullable;

public record GetNextFulfilmentEntityResponse(
                /**
                 * Null if there are no more fulfilment entities.
                 */
                @Nullable String fulfilmentEntityId) {
}
