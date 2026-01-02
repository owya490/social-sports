package com.functions.fulfilment.models.responses;

import java.util.List;

import javax.annotation.Nullable;

import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntityType;
import com.google.cloud.Timestamp;

public record GetFulfilmentSessionInfoResponse(
                List<FulfilmentEntityType> fulfilmentEntityTypes,
                @Nullable Integer currentEntityIndex,
                Timestamp fulfilmentSessionStartTime) {
}
