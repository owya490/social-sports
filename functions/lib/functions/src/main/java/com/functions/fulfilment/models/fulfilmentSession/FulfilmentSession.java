package com.functions.fulfilment.models.fulfilmentSession;

import static com.functions.utils.JavaUtils.objectMapper;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.core.type.TypeReference;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventData;
import com.functions.fulfilment.models.fulfilmentEntities.DelayedStripeFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.EndFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.FormsFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntityType;
import com.functions.fulfilment.models.fulfilmentEntities.StripeFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.WaitlistFulfilmentEntity;
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
     * Store the type of FulfilmentSession for the purpose of deserialisation from Firebase so we
     * know which concrete class to instantiate. Unfortunately, Firebase does not support
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
     * List of FulfilmentEntityIds specifying their order in the fulfilment session workflow.
     */
    private List<String> fulfilmentEntityIds;

    private FulfilmentSessionStatus status;
    private String purchaserEmail;
    private String purchaserName;

    private static final Logger logger = LoggerFactory.getLogger(FulfilmentSession.class);

    /**
     * This method handles the deserialization of FulfilmentSession from a Firestore
     * DocumentSnapshot.
     * <p>
     * Firestore deserialization can't take advantage of java polymorphism - when deserializing a
     * list of abstract FulfilmentEntity class, it will not know which concrete class to
     * instantiate.
     */
    public static FulfilmentSession fromFirestore(DocumentSnapshot snapshot) {
        // Read the fulfilmentEntityMap directly from Firestore
        Map<String, Object> rawEntityMap =
                (Map<String, Object>) snapshot.get("fulfilmentEntityMap");
        if (rawEntityMap == null) {
            throw new IllegalArgumentException(
                    "fulfilmentEntityMap is missing in Firestore document");
        }
        Map<String, FulfilmentEntity> entityMap = readEntityMap(rawEntityMap);

        // Read the fulfilmentEntityIds directly from Firestore
        List<String> entityIds = (List<String>) snapshot.get("fulfilmentEntityIds");
        if (entityIds == null) {
            throw new IllegalArgumentException(
                    "fulfilmentEntityIds is missing in Firestore document");
        }

        // Get the session type from Firestore
        FulfilmentSessionType sessionType =
                FulfilmentSessionType.valueOf((String) snapshot.get("type"));

        return build(
                snapshot.getId(),
                sessionType,
                snapshot.getTimestamp("fulfilmentSessionStartTime"),
                objectMapper.convertValue(snapshot.get("eventData"), EventData.class),
                entityMap,
                entityIds,
                getInteger(snapshot, "numTickets"),
                snapshot.getString("eventTicketTypeId"),
                snapshot.getString("eventTicketTypeName"),
                getInteger(snapshot, "price"),
                readStatus(snapshot.getString("status")),
                snapshot.getString("purchaserEmail"),
                snapshot.getString("purchaserName"));
    }

    /**
     * Deserializes a fulfilment session from the JSON object carried on the
     * process-fulfilment-sessions topic. The message is the session itself.
     */
    public static FulfilmentSession fromJson(String json) throws IOException {
        if (json == null || json.isBlank()) {
            throw new IllegalArgumentException("Fulfilment session JSON is empty");
        }
        Map<String, Object> data = objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        Map<String, Object> rawEntityMap = mapValue(data.get("fulfilmentEntityMap"));
        if (rawEntityMap == null) {
            throw new IllegalArgumentException("fulfilmentEntityMap is missing in fulfilment session JSON");
        }
        List<String> entityIds = data.get("fulfilmentEntityIds") == null
                ? null
                : objectMapper.convertValue(data.get("fulfilmentEntityIds"), new TypeReference<List<String>>() {});
        if (entityIds == null) {
            throw new IllegalArgumentException("fulfilmentEntityIds is missing in fulfilment session JSON");
        }
        if (data.get("type") == null) {
            throw new IllegalArgumentException("type is missing in fulfilment session JSON");
        }
        return build(
                stringValue(data.get("id")),
                FulfilmentSessionType.valueOf(String.valueOf(data.get("type"))),
                readTimestamp(data.get("fulfilmentSessionStartTime")),
                data.get("eventData") == null
                        ? null
                        : objectMapper.convertValue(data.get("eventData"), EventData.class),
                readEntityMap(rawEntityMap),
                entityIds,
                integerValue(data.get("numTickets")),
                stringValue(data.get("eventTicketTypeId")),
                stringValue(data.get("eventTicketTypeName")),
                integerValue(data.get("price")),
                readStatus(stringValue(data.get("status"))),
                stringValue(data.get("purchaserEmail")),
                stringValue(data.get("purchaserName")));
    }

    private static FulfilmentSession build(
            String id,
            FulfilmentSessionType sessionType,
            Timestamp startTime,
            EventData eventData,
            Map<String, FulfilmentEntity> entityMap,
            List<String> entityIds,
            Integer numTickets,
            String eventTicketTypeId,
            String eventTicketTypeName,
            Integer price,
            FulfilmentSessionStatus status,
            String purchaserEmail,
            String purchaserName) {
        switch (sessionType) {
            case CHECKOUT:
                return CheckoutFulfilmentSession.builder()
                        .id(id)
                        .eventData(eventData)
                        .fulfilmentSessionStartTime(startTime)
                        .fulfilmentEntityMap(entityMap)
                        .fulfilmentEntityIds(entityIds)
                        .numTickets(numTickets)
                        .eventTicketTypeId(eventTicketTypeId)
                        .eventTicketTypeName(eventTicketTypeName)
                        .price(price)
                        .status(status)
                        .purchaserEmail(purchaserEmail)
                        .purchaserName(purchaserName)
                        .build();
            case BOOKING_APPROVAL:
                return BookingApprovalFulfilmentSession.builder()
                        .id(id)
                        .eventData(eventData)
                        .fulfilmentSessionStartTime(startTime)
                        .fulfilmentEntityMap(entityMap)
                        .fulfilmentEntityIds(entityIds)
                        .numTickets(numTickets)
                        .eventTicketTypeId(eventTicketTypeId)
                        .eventTicketTypeName(eventTicketTypeName)
                        .price(price)
                        .status(status)
                        .purchaserEmail(purchaserEmail)
                        .purchaserName(purchaserName)
                        .build();
            case WAITLIST:
                return WaitlistFulfilmentSession.builder()
                        .id(id)
                        .eventData(eventData)
                        .fulfilmentSessionStartTime(startTime)
                        .fulfilmentEntityMap(entityMap)
                        .fulfilmentEntityIds(entityIds)
                        .numTickets(numTickets)
                        .eventTicketTypeId(eventTicketTypeId)
                        .price(price)
                        .status(status)
                        .purchaserEmail(purchaserEmail)
                        .purchaserName(purchaserName)
                        .build();
            default:
                throw new IllegalArgumentException("Unknown FulfilmentSession type: " + sessionType);
        }
    }

    private static Map<String, FulfilmentEntity> readEntityMap(Map<String, Object> rawEntityMap) {
        Map<String, FulfilmentEntity> entityMap = new HashMap<>();
        for (Map.Entry<String, Object> entry : rawEntityMap.entrySet()) {
            String entityId = entry.getKey();
            Map<String, Object> entityData = mapValue(entry.getValue());
            if (entityData == null) {
                throw new IllegalArgumentException("Entity data is null for entityId: " + entityId);
            }
            try {
                String json = objectMapper.writeValueAsString(entityData);
                FulfilmentEntityType type = FulfilmentEntityType.valueOf(String.valueOf(entityData.get("type")));
                FulfilmentEntity entity;
                switch (type) {
                    case STRIPE:
                        entity = objectMapper.readValue(json, StripeFulfilmentEntity.class);
                        break;
                    case DELAYED_STRIPE:
                        entity = objectMapper.readValue(json, DelayedStripeFulfilmentEntity.class);
                        break;
                    case FORMS:
                        entity = objectMapper.readValue(json, FormsFulfilmentEntity.class);
                        break;
                    case WAITLIST:
                        entity = objectMapper.readValue(json, WaitlistFulfilmentEntity.class);
                        break;
                    case END:
                        entity = objectMapper.readValue(json, EndFulfilmentEntity.class);
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
        return entityMap;
    }

    /**
     * Firestore stores integers as longs and does not distinguish the two.
     */
    private static Integer getInteger(DocumentSnapshot snapshot, String field) {
        Long value = snapshot.getLong(field);
        return value == null ? null : value.intValue();
    }

    private static FulfilmentSessionStatus readStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        return FulfilmentSessionStatus.valueOf(status);
    }

    private static Timestamp readTimestamp(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Timestamp timestamp) {
            return timestamp;
        }
        if (value instanceof String text && !text.isBlank()) {
            return Timestamp.parseTimestamp(text);
        }
        return objectMapper.convertValue(value, Timestamp.class);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> mapValue(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return null;
    }

    private static String stringValue(Object value) {
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value);
        return text.isBlank() ? null : text;
    }

    private static Integer integerValue(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        return Integer.valueOf(String.valueOf(value));
    }
}
