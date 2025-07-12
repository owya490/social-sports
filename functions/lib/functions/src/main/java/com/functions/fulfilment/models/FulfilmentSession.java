package com.functions.fulfilment.models;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.annotation.DocumentId;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder(toBuilder = true)
@NoArgsConstructor(force = true, access = AccessLevel.PRIVATE)
@AllArgsConstructor
public class FulfilmentSession {
    /**
     * Firestore document ID
     */
    @DocumentId
    private String id;

    private Timestamp fulfilmentSessionStartTime;
    private String eventId;
    /**
     * Map of FulfilmentEntityIds to FulfilmentEntity objects.
     */
    private Map<String, FulfilmentEntity> fulfilmentEntityMap;
    /**
     * List of FulfilmentEntityIds specifying their order in the fulfilment session workflow.
     */
    private List<String> fulfilmentEntityOrder;

    private static Logger logger = LoggerFactory.getLogger(FulfilmentSession.class);

    /**
     * This method handles the deserialization of FulfilmentSession from a Firestore DocumentSnapshot.
     * <p>
     * Firestore deserialization can't take advantage of java polymorphism - when deserializing
     * a list of abstract FulfilmentEntity class, it will not know which concrete class to instantiate.
     */
    public static FulfilmentSession fromFirestore(DocumentSnapshot snapshot) {
        FulfilmentSession session = new FulfilmentSession();
        session.setId(snapshot.getId());
        session.setEventId(snapshot.getString("eventId"));
        session.setFulfilmentSessionStartTime(snapshot.getTimestamp("fulfilmentSessionStartTime"));

        Map<String, FulfilmentEntity> entityMap = new LinkedHashMap<>();
        List<String> entityOrder = new ArrayList<>();

        List<Map<String, Object>> entitiesList = (List<Map<String, Object>>) snapshot.get("fulfilmentEntities");

        if (entitiesList != null) {
            for (Map<String, Object> entityData : entitiesList) {
                String entityId = (String) entityData.get("id");
                FulfilmentEntityType type = FulfilmentEntityType.valueOf((String) entityData.get("type"));
                FulfilmentEntity entity;

                switch (type) {
                    case START:
                        entity = StartFulfilmentEntity.builder().url((String) entityData.get("url")).type(type).build();
                        break;
                    case STRIPE:
                        entity = StripeFulfilmentEntity.builder().url((String) entityData.get("url")).type(type).build();
                        break;
                    case FORMS:
                        entity = FormsFulfilmentEntity.builder().formId((String) entityData.get("formId"))
                                .formResponseIds((List<String>) entityData.get("formResponseIds"))
                                .submittedFormResponseIds((List<String>) entityData.get("submittedFormResponseIds"))
                                .url((String) entityData.get("url"))
                                .type(type).build();
                        break;
                    default:
                        throw new IllegalArgumentException("Unknown FulfilmentEntity type: " + entityData.get("type"));
                }

                entityMap.put(entityId, entity);
                entityOrder.add(entityId);
            }
        }

        session.setFulfilmentEntityMap(entityMap);
        session.setFulfilmentEntityOrder(entityOrder);
        return session;
    }

    public Map<String, Object> toFirestore() {
        Map<String, Object> data = new HashMap<>();
        data.put("eventId", eventId);
        data.put("fulfilmentSessionStartTime", fulfilmentSessionStartTime);

        List<Map<String, Object>> entitiesList = new ArrayList<>();
        for (String entityId : fulfilmentEntityOrder) {
            FulfilmentEntity entity = fulfilmentEntityMap.get(entityId);
            Map<String, Object> entityData = new HashMap<>();
            entityData.put("id", entityId);
            entityData.put("type", entity.getType().name());
            entityData.put("url", entity.getUrl());
            // Add other entity-specific fields here
            entitiesList.add(entityData);
        }

        data.put("fulfilmentEntities", entitiesList);
        return data;
    }

    /**
     * Validates whether the frontend should be allowed to route to a specific FulfilmentEntity.
     * @param entityId The ID of the FulfilmentEntity to validate.
     * @return The URL of the FulfilmentEntity if valid, otherwise an error message.
     */
    public Map<String, Object> validateAndGetResponse(String entityId) {
        FulfilmentEntity entity = fulfilmentEntityMap.get(entityId);
        if (entity == null) {
            logger.warn("Invalid FulfilmentEntityId: " + entityId);
            return Map.of("error", "User does not have permission to route to this URL yet.");
        }

        // Add additional validation logic here if needed

        return Map.of("url", entity.getUrl());
    }
}
