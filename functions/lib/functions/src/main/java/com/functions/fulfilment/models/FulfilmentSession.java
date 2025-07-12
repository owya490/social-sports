package com.functions.fulfilment.models;

import static com.functions.utils.JavaUtils.objectMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventData;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;

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
    Timestamp fulfilmentSessionStartTime;
    EventData eventData;
    List<FulfilmentEntity> fulfilmentEntities;
    Integer currentFulfilmentIndex;

    private static Logger logger = LoggerFactory.getLogger(FulfilmentSession.class);

    /**
     * This method handles the deserialization of FulfilmentSession from a Firestore DocumentSnapshot.
     * <p>
     * Firestore deserialization can't take advantage of java polymorphism - when deserializing
     * a list of abstract FulfilmentEntity class, it will not know which concrete class to instantiate.
     */
    public static FulfilmentSession fromFirestore(DocumentSnapshot snapshot) {
        List<FulfilmentEntity> entities = new ArrayList<>();
        List<Map<String, Object>> entitiesList = (List<Map<String, Object>>) snapshot.get("fulfilmentEntities");

        if (entitiesList != null) {
            for (Map<String, Object> entityData : entitiesList) {
                try {
                    // Convert the map to JSON string, then deserialize using Jackson
                    String json = objectMapper.writeValueAsString(entityData);
                    FulfilmentEntityType type = FulfilmentEntityType.valueOf((String) entityData.get("type"));
                    FulfilmentEntity entity;
                    switch (type) {
                    case START:
                        entity = objectMapper
                        .readValue(json, StartFulfilmentEntity.class);
                        break;
                    case STRIPE:
                        entity = objectMapper
                        .readValue(json, StripeFulfilmentEntity.class);
                        break;
                    case FORMS:
                        entity = objectMapper
                        .readValue(json, FormsFulfilmentEntity.class);
                        break;
                    default:
                        throw new IllegalArgumentException("Unknown FulfilmentEntity type: " + entityData.get("type"));
                    }
                    entities.add(entity);
                } catch (Exception e) {
                    logger.error("Failed to deserialize FulfilmentEntity: {}", entityData, e);
                }
            }
        }
        return FulfilmentSession.builder()
            .eventData(objectMapper.convertValue(snapshot.get("eventData"), EventData.class))
            .fulfilmentSessionStartTime(snapshot.getTimestamp("fulfilmentSessionStartTime"))
            .currentFulfilmentIndex(snapshot.getLong("currentFulfilmentIndex") != null
                ? Objects.requireNonNull(snapshot.getLong("currentFulfilmentIndex")).intValue()
                : null)
            .fulfilmentEntities(entities)
            .build();
    }
}
