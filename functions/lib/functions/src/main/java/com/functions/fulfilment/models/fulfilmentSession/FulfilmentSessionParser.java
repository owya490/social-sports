package com.functions.fulfilment.models.fulfilmentSession;

import static com.functions.utils.JavaUtils.objectMapper;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.functions.events.models.EventData;
import com.functions.fulfilment.models.fulfilmentEntities.DelayedStripeFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.EndFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.FormsFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntityType;
import com.functions.fulfilment.models.fulfilmentEntities.StripeFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.WaitlistFulfilmentEntity;
import com.google.cloud.Timestamp;

/**
 * Reads the fulfilment session object carried on the Pub/Sub message.
 */
final class FulfilmentSessionParser {
    private FulfilmentSessionParser() {
    }

    static FulfilmentSession parse(String json) throws IOException {
        if (json == null || json.isBlank()) {
            throw new IllegalArgumentException("Fulfilment session JSON is empty");
        }
        JsonNode root = objectMapper.readTree(json);
        JsonNode entityMap = root.get("fulfilmentEntityMap");
        JsonNode entityIds = root.get("fulfilmentEntityIds");
        if (entityMap == null || entityMap.isNull() || entityIds == null || entityIds.isNull()) {
            throw new IllegalArgumentException("Fulfilment session JSON is missing its entities");
        }

        FulfilmentSessionType type = FulfilmentSessionType.valueOf(requiredText(root, "type"));
        FulfilmentSession session = session(type, root);
        session.setId(text(root, "id"));
        session.setEventData(root.get("eventData") == null || root.get("eventData").isNull()
                ? null
                : objectMapper.treeToValue(root.get("eventData"), EventData.class));
        session.setFulfilmentSessionStartTime(timestamp(root.get("fulfilmentSessionStartTime")));
        session.setFulfilmentEntityMap(readEntities(entityMap));
        session.setFulfilmentEntityIds(objectMapper.convertValue(entityIds, new TypeReference<List<String>>() {}));
        String status = text(root, "status");
        session.setStatus(status == null ? null : FulfilmentSessionStatus.valueOf(status));
        session.setPurchaserEmail(text(root, "purchaserEmail"));
        session.setPurchaserName(text(root, "purchaserName"));
        return session;
    }

    private static FulfilmentSession session(FulfilmentSessionType type, JsonNode root) {
        Integer numTickets = integer(root.get("numTickets"));
        Integer price = integer(root.get("price"));
        String eventTicketTypeId = text(root, "eventTicketTypeId");
        switch (type) {
            case CHECKOUT:
                return CheckoutFulfilmentSession.builder()
                        .numTickets(numTickets)
                        .eventTicketTypeId(eventTicketTypeId)
                        .eventTicketTypeName(text(root, "eventTicketTypeName"))
                        .price(price)
                        .build();
            case BOOKING_APPROVAL:
                return BookingApprovalFulfilmentSession.builder()
                        .numTickets(numTickets)
                        .eventTicketTypeId(eventTicketTypeId)
                        .eventTicketTypeName(text(root, "eventTicketTypeName"))
                        .price(price)
                        .build();
            case WAITLIST:
                return WaitlistFulfilmentSession.builder()
                        .numTickets(numTickets)
                        .eventTicketTypeId(eventTicketTypeId)
                        .price(price)
                        .build();
            default:
                throw new IllegalArgumentException("Unknown FulfilmentSession type: " + type);
        }
    }

    private static Map<String, FulfilmentEntity> readEntities(JsonNode entityMap) throws IOException {
        Map<String, FulfilmentEntity> entities = new HashMap<>();
        var fields = entityMap.fields();
        while (fields.hasNext()) {
            var field = fields.next();
            JsonNode entity = field.getValue();
            FulfilmentEntityType type = FulfilmentEntityType.valueOf(requiredText(entity, "type"));
            Class<? extends FulfilmentEntity> clazz = switch (type) {
                case STRIPE -> StripeFulfilmentEntity.class;
                case DELAYED_STRIPE -> DelayedStripeFulfilmentEntity.class;
                case FORMS -> FormsFulfilmentEntity.class;
                case WAITLIST -> WaitlistFulfilmentEntity.class;
                case END -> EndFulfilmentEntity.class;
            };
            entities.put(field.getKey(), objectMapper.treeToValue(entity, clazz));
        }
        return entities;
    }

    private static String requiredText(JsonNode node, String field) {
        String value = text(node, field);
        if (value == null) {
            throw new IllegalArgumentException(field + " is missing in fulfilment session JSON");
        }
        return value;
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node == null ? null : node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        String text = value.asText();
        return text == null || text.isBlank() ? null : text;
    }

    private static Integer integer(JsonNode value) {
        if (value == null || value.isNull() || !value.isNumber()) {
            return null;
        }
        return value.asInt();
    }

    private static Timestamp timestamp(JsonNode value) {
        String text = value == null || value.isNull() ? null : value.asText();
        if (text == null || text.isBlank()) {
            return null;
        }
        return Timestamp.parseTimestamp(text);
    }
}
