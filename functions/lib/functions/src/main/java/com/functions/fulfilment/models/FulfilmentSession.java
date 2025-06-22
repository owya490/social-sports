package com.functions.fulfilment.models;

import com.google.cloud.Timestamp;
import lombok.*;

import java.util.List;

@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class FulfilmentSession {
    Timestamp fulfilmentSessionStartTime;
    String eventId;
    List<FulfilmentEntity> fulfilmentEntities;
    Integer currentFulfilmentIndex;
}
