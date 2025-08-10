package com.functions.fulfilment.models.responses;

import java.util.List;

import javax.annotation.Nullable;

import com.functions.fulfilment.models.FulfilmentEntityType;

public record GetFulfilmentSessionInfoResponse(
        List<FulfilmentEntityType> fulfilmentEntityTypes,
        @Nullable Integer currentEntityIndex) {
}
