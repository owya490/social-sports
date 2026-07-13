package com.functions.events.utils;

import java.util.Comparator;
import java.util.Map;
import java.util.Optional;

import javax.annotation.Nullable;

import com.functions.events.models.EventData;
import com.functions.events.models.EventTicketType;

public class EventTicketTypesUtils {

    private EventTicketTypesUtils() {}

    public static boolean hasEventTicketTypes(@Nullable EventData eventData) {
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

    public static int resolveCheckoutPrice(EventData eventData, @Nullable String eventTicketTypeId) {
        if (hasEventTicketTypes(eventData)) {
            EventTicketType ticketType = findEventTicketType(eventData, eventTicketTypeId)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Invalid event ticket type: " + eventTicketTypeId));
            if (!isEventTicketTypeActive(ticketType)) {
                throw new IllegalArgumentException("Event ticket type is not active: " + eventTicketTypeId);
            }
            return ticketType.getPrice() != null ? ticketType.getPrice() : 0;
        }
        return eventData.getPrice() != null ? eventData.getPrice() : 0;
    }

    public static int resolveCheckoutVacancy(EventData eventData, @Nullable String eventTicketTypeId) {
        if (hasEventTicketTypes(eventData)) {
            EventTicketType ticketType = findEventTicketType(eventData, eventTicketTypeId)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Invalid event ticket type: " + eventTicketTypeId));
            return ticketType.getVacancy() != null ? ticketType.getVacancy() : 0;
        }
        return eventData.getVacancy() != null ? eventData.getVacancy() : 0;
    }

    public static String resolveCheckoutTypeName(EventData eventData, @Nullable String eventTicketTypeId) {
        if (hasEventTicketTypes(eventData)) {
            return findEventTicketType(eventData, eventTicketTypeId)
                    .map(EventTicketType::getName)
                    .orElse("");
        }
        return "General Admission";
    }

    public static String vacancyFieldPath(@Nullable String eventTicketTypeId) {
        if (eventTicketTypeId == null || eventTicketTypeId.isBlank()) {
            return "vacancy";
        }
        return "eventTicketTypes." + eventTicketTypeId + ".vacancy";
    }
}
