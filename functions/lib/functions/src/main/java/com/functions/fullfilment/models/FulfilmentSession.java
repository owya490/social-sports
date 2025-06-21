package com.functions.fullfilment.models;

import com.google.cloud.Timestamp;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Value;

import java.util.List;

@Value
@Builder(toBuilder = true)
@NoArgsConstructor(force = true, access = lombok.AccessLevel.PRIVATE)
@AllArgsConstructor
public class FulfilmentSession {
    Timestamp fulfilmentSessionStartTime;
    String eventId;
    List<FulfilmentEntity> fulfilmentEntities;
    FulfilmentEntity currentFulfilmentEntity;
}
