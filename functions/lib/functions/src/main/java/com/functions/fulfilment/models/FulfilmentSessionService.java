package com.functions.fulfilment.models;

import java.util.AbstractMap.SimpleEntry;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;

public interface FulfilmentSessionService<T extends FulfilmentSession> {
    T initFulfilmentSession(String fulfilmentSessionId, String eventId, Integer numTickets) throws Exception;

    public static SimpleEntry<Map<String, FulfilmentEntity>, List<String>> getOrderedFulfilmentEntities(
            List<SimpleEntry<String, FulfilmentEntity>> fulfilmentEntities) {
        Map<String, FulfilmentEntity> entityMap = new HashMap<>();
        List<String> entityOrder = new ArrayList<>();

        for (SimpleEntry<String, FulfilmentEntity> entry : fulfilmentEntities) {
            String entityId = entry.getKey();
            FulfilmentEntity entity = entry.getValue();
            entityMap.put(entityId, entity);
            entityOrder.add(entityId);
        }
        return new SimpleEntry<>(entityMap, entityOrder);
    }
}
