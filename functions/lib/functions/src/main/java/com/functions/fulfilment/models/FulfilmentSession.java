package com.functions.fulfilment.models;

import static com.functions.utils.JavaUtils.objectMapper;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventData;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.annotation.DocumentId;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder(toBuilder = true)
@NoArgsConstructor(force = true, access = AccessLevel.PRIVATE)
@AllArgsConstructor
public abstract class FulfilmentSession {
    /**
     * Firestore document ID
     */
    @DocumentId
    private String id;

    /**
     * Store the type of FulfilmentSession for the purpose of deserialisation from
     * Firebase so we know
     * which concrete class to instantiate. Unfortunately, Firebase does not support
     * polymorphism directly.
     */
    private FulfilmentSessionType type;

    private Timestamp fulfilmentSessionStartTime;
    private EventData eventData;
    /**
     * Map of FulfilmentEntityIds to FulfilmentEntity objects.
     */
    private Map<String, FulfilmentEntity> fulfilmentEntityMap;
    /**
     * List of FulfilmentEntityIds specifying their order in the fulfilment session
     * workflow.
     */
    private List<String> fulfilmentEntityIds;

    private static Logger logger = LoggerFactory.getLogger(FulfilmentSession.class);

    /**
     * This method handles the deserialization of FulfilmentSession from a Firestore
     * DocumentSnapshot.
     * <p>
     * Firestore deserialization can't take advantage of java polymorphism - when
     * deserializing
     * a list of abstract FulfilmentEntity class, it will not know which concrete
     * class to instantiate.
     */
    public static FulfilmentSession fromFirestore(DocumentSnapshot snapshot) {
        // Read the fulfilmentEntityMap directly from Firestore
        @SuppressWarnings("unchecked")
        Map<String, Object> rawEntityMap = (Map<String, Object>) snapshot.get("fulfilmentEntityMap");
        Map<String, FulfilmentEntity> entityMap = new HashMap<>();

        if (rawEntityMap != null) {
            for (Map.Entry<String, Object> entry : rawEntityMap.entrySet()) {
                String entityId = entry.getKey();
                @SuppressWarnings("unchecked")
                Map<String, Object> entityData = (Map<String, Object>) entry.getValue();

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
                        case END:
                            entity = objectMapper
                                    .readValue(json, EndFulfilmentEntity.class);
                            break;
                        default:
                            throw new IllegalArgumentException(
                                    "Unknown FulfilmentEntity type: " + entityData.get("type"));
                    }

                    entityMap.put(entityId, entity);
                } catch (Exception e) {
                    logger.error("Failed to deserialize FulfilmentEntity: {}", entityData, e);
                }
            }
        }

        // Read the fulfilmentEntityIds directly from Firestore
        @SuppressWarnings("unchecked")
        List<String> entityIds = (List<String>) snapshot.get("fulfilmentEntityIds");
        if (entityIds == null) {
            entityIds = new ArrayList<>();
        }

        // Get the session type from Firestore
        FulfilmentSessionType sessionType = FulfilmentSessionType.valueOf(
                (String) snapshot.get("type"));

        // Create the appropriate session type
        switch (sessionType) {
            case CHECKOUT:
                Integer numTickets = null;
                Long numTicketsLong = snapshot.getLong("numTickets");
                if (numTicketsLong != null) {
                    numTickets = numTicketsLong.intValue();
                }
                return CheckoutFulfilmentSession.builder()
                        .eventData(objectMapper.convertValue(snapshot.get("eventData"), EventData.class))
                        .fulfilmentSessionStartTime(snapshot.getTimestamp("fulfilmentSessionStartTime"))
                        .fulfilmentEntityMap(entityMap)
                        .fulfilmentEntityIds(entityIds)
                        .numTickets(numTickets)
                        .build();
            default:
                throw new IllegalArgumentException("Unknown FulfilmentSession type: " + sessionType);
        }
    }
}
