package com.functions.events.utils;

import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import javax.annotation.Nullable;

import com.functions.events.models.AbstractEventData;
import com.functions.events.models.EventData;
import com.functions.events.models.EventTicketType;

public class EventTicketTypesUtils {

    public static final String DEFAULT_TICKET_TYPE_NAME = "General Admission";

    private EventTicketTypesUtils() {}

    public static boolean hasEventTicketTypes(@Nullable AbstractEventData eventData) {
        return eventData != null
                && eventData.getEventTicketTypes() != null
                && !eventData.getEventTicketTypes().isEmpty();
    }

    public static Optional<EventTicketType> findEventTicketType(
            @Nullable EventData eventData, @Nullable String eventTicketTypeId) {
        if (eventData == null
                || eventTicketTypeId == null
                || eventTicketTypeId.isBlank()
                || eventData.getEventTicketTypes() == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(eventData.getEventTicketTypes().get(eventTicketTypeId));
    }

    public static boolean isEventTicketTypeActive(EventTicketType eventTicketType) {
        return eventTicketType != null
                && (eventTicketType.getIsActive() == null || Boolean.TRUE.equals(eventTicketType.getIsActive()));
    }

    public static Optional<String> getDefaultEventTicketTypeId(EventData eventData) {
        if (!hasEventTicketTypes(eventData) || eventData.getEventTicketTypes() == null) {
            return Optional.empty();
        }
        return eventData.getEventTicketTypes().entrySet().stream()
                .filter(entry -> isEventTicketTypeActive(entry.getValue()))
                .min(Comparator.comparingInt(entry -> entry.getValue().getSortOrder() != null
                        ? entry.getValue().getSortOrder()
                        : 0))
                .map(Map.Entry::getKey);
    }

    /**
     * Resolves the ticket type ID for checkout. When the client omits eventTicketTypeId,
     * defaults to the first active ticket type (General Admission for newly created events).
     */
    @Nullable
    public static String resolveEventTicketTypeIdForCheckout(
            EventData eventData, @Nullable String eventTicketTypeId) {
        if (!hasEventTicketTypes(eventData)) {
            return null;
        }
        if (eventTicketTypeId != null && !eventTicketTypeId.isBlank()) {
            return eventTicketTypeId;
        }
        return getDefaultEventTicketTypeId(eventData)
                .orElseThrow(() -> new IllegalArgumentException("No active ticket type found for event"));
    }

    public static Map<String, EventTicketType> buildDefaultEventTicketTypesForNewEvent(
            @Nullable Integer price,
            @Nullable Integer capacity,
            @Nullable Integer vacancy,
            @Nullable String formId) {
        String eventTicketTypeId = UUID.randomUUID().toString();
        EventTicketType eventTicketType = new EventTicketType();
        eventTicketType.setName(DEFAULT_TICKET_TYPE_NAME);
        eventTicketType.setPrice(price != null ? price : 0);
        eventTicketType.setCapacity(capacity != null ? capacity : 0);
        eventTicketType.setVacancy(vacancy != null ? vacancy : 0);
        eventTicketType.setFormId(formId);
        eventTicketType.setSortOrder(0);
        eventTicketType.setIsActive(true);

        Map<String, EventTicketType> eventTicketTypes = new HashMap<>();
        eventTicketTypes.put(eventTicketTypeId, eventTicketType);
        return eventTicketTypes;
    }

    public static int resolveCheckoutPrice(EventData eventData, @Nullable String eventTicketTypeId) {
        String resolvedTicketTypeId = resolveEventTicketTypeIdForCheckout(eventData, eventTicketTypeId);
        if (hasEventTicketTypes(eventData)) {
            EventTicketType ticketType = findEventTicketType(eventData, resolvedTicketTypeId)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Invalid event ticket type: " + resolvedTicketTypeId));
            if (!isEventTicketTypeActive(ticketType)) {
                throw new IllegalArgumentException("Event ticket type is not active: " + resolvedTicketTypeId);
            }
            return ticketType.getPrice() != null ? ticketType.getPrice() : 0;
        }
        return eventData.getPrice() != null ? eventData.getPrice() : 0;
    }

    public static int resolveCheckoutVacancy(EventData eventData, @Nullable String eventTicketTypeId) {
        String resolvedTicketTypeId = resolveEventTicketTypeIdForCheckout(eventData, eventTicketTypeId);
        if (hasEventTicketTypes(eventData)) {
            EventTicketType ticketType = findEventTicketType(eventData, resolvedTicketTypeId)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Invalid event ticket type: " + resolvedTicketTypeId));
            return ticketType.getVacancy() != null ? ticketType.getVacancy() : 0;
        }
        return eventData.getVacancy() != null ? eventData.getVacancy() : 0;
    }

    public static String resolveCheckoutTypeName(EventData eventData, @Nullable String eventTicketTypeId) {
        String resolvedTicketTypeId = resolveEventTicketTypeIdForCheckout(eventData, eventTicketTypeId);
        if (hasEventTicketTypes(eventData)) {
            return findEventTicketType(eventData, resolvedTicketTypeId)
                    .map(EventTicketType::getName)
                    .orElse("");
        }
        return DEFAULT_TICKET_TYPE_NAME;
    }

    public static String vacancyFieldPath(@Nullable String eventTicketTypeId) {
        if (eventTicketTypeId == null || eventTicketTypeId.isBlank()) {
            return "vacancy";
        }
        return "eventTicketTypes." + eventTicketTypeId + ".vacancy";
    }
}
