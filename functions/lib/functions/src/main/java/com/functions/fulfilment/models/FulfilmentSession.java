package com.functions.fulfilment.models;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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
    String eventId;
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
        FulfilmentSession session = new FulfilmentSession();
        session.setEventId(snapshot.getString("eventId"));
        session.setFulfilmentSessionStartTime(snapshot.getTimestamp("fulfilmentSessionStartTime"));
        session.setCurrentFulfilmentIndex(snapshot.getLong("currentFulfilmentIndex") != null ?
                Objects.requireNonNull(snapshot.getLong("currentFulfilmentIndex")).intValue() : null);

        List<FulfilmentEntity> entities = new ArrayList<>();
        List<Map<String, Object>> entitiesList = (List<Map<String, Object>>) snapshot.get("fulfilmentEntities");

        if (entitiesList != null) {
            for (Map<String, Object> entityData : entitiesList) {
                FulfilmentEntityType type = FulfilmentEntityType.valueOf((String) entityData.get("type"));
                switch (type) {
                    case START:
                        entities.add(StartFulfilmentEntity.builder().url((String) entityData.get("url")).type(FulfilmentEntityType.valueOf((String) entityData.get("type"))).build());
                        break;
                    case STRIPE:
                        entities.add(StripeFulfilmentEntity.builder().url((String) entityData.get("url")).type(FulfilmentEntityType.valueOf((String) entityData.get("type"))).build());
                        break;
                    case FORMS:
                        entities.add(FormsFulfilmentEntity.builder().formId((String) entityData.get("formId"))
                                .formResponseIds((List<String>) entityData.get("formResponseIds"))
                                .submittedFormResponseIds((List<String>) entityData.get("submittedFormResponseIds"))
                                .url((String) entityData.get("url"))
                                .type(FulfilmentEntityType.valueOf((String) entityData.get("type"))).build());
                        break;
                    default:
                        throw new IllegalArgumentException("Unknown FulfilmentEntity type: " + entityData.get("type"));
                }
            }
        }

        session.setFulfilmentEntities(entities);
        return session;
    }
}
