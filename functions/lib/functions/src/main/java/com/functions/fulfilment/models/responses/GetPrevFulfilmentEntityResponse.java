package com.functions.fulfilment.models.responses;

import javax.annotation.Nullable;

public record GetPrevFulfilmentEntityResponse(
                /**
                 * Null if there are no previous fulfilment entities.
                 */
                @Nullable String fulfilmentEntityId) {
}
