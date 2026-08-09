package com.functions.events.services;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import javax.annotation.Nullable;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventData;
import com.functions.events.models.EventTicketType;
import com.functions.events.models.ResolvedEventTicketType;
import com.functions.stripe.exceptions.CheckoutVacancyException;
import com.functions.tickets.models.Ticket;

/**
 * Resolves event ticket types for purchase, inventory, and admin flows.
 */
public class EventTicketTypeService {
    private static final Logger logger = LoggerFactory.getLogger(EventTicketTypeService.class);

    public static final String GENERAL_TICKET_TYPE_NAME = "General Admission";

    private EventTicketTypeService() {
    }

    /**
     * Resolves the General Admission ticket type for legacy/admin flows that still default to GA.
     * Prefers {@code eventTicketTypes}; falls back to top-level price/capacity/vacancy for
     * legacy events that have not been migrated yet.
     */
    public static ResolvedEventTicketType resolve(EventData event) {
        if (event == null) {
            throw new IllegalArgumentException("Event data is required to resolve a ticket type");
        }

        Map<String, EventTicketType> ticketTypes = event.getEventTicketTypes();
        if (ticketTypes != null && !ticketTypes.isEmpty()) {
            EventTicketType general = findByName(ticketTypes, GENERAL_TICKET_TYPE_NAME);
            if (general == null && ticketTypes.size() == 1) {
                general = ticketTypes.values().iterator().next();
            }
            if (general == null) {
                throw new IllegalStateException(
                        "Event " + event.getEventId() + " has no General Admission ticket type");
            }

            return toResolved(general, false);
        }

        logger.info(
                "Event {} missing eventTicketTypes; falling back to top-level price/capacity/vacancy",
                event.getEventId());
        return ResolvedEventTicketType.builder()
                .id(UUID.nameUUIDFromBytes(("legacy-general:" + event.getEventId()).getBytes()).toString())
                .name(GENERAL_TICKET_TYPE_NAME)
                .price(event.getPrice())
                .vacancy(event.getVacancy())
                .capacity(event.getCapacity())
                .legacy(true)
                .build();
    }

    /**
     * Resolves a ticket type by ID from {@code eventTicketTypes}. Used for checkout and attendee flows.
     */
    public static ResolvedEventTicketType resolveById(EventData event, String eventTicketTypeId) {
        if (event == null) {
            throw new IllegalArgumentException("Event data is required to resolve a ticket type");
        }
        if (eventTicketTypeId == null || eventTicketTypeId.isBlank()) {
            throw new IllegalArgumentException("eventTicketTypeId is required");
        }

        Map<String, EventTicketType> ticketTypes = event.getEventTicketTypes();
        if (ticketTypes == null || ticketTypes.isEmpty()) {
            throw new IllegalStateException(
                    "Event " + event.getEventId() + " has no eventTicketTypes");
        }

        EventTicketType ticketType = findById(ticketTypes, eventTicketTypeId);
        if (ticketType == null) {
            throw new IllegalArgumentException(
                    "Ticket type " + eventTicketTypeId + " not found for event " + event.getEventId());
        }

        return toResolved(ticketType, false);
    }

    /**
     * Resolves the ticket type for reserved slots: General Admission by name, else first in map.
     */
    public static ResolvedEventTicketType resolveForReservedSlots(EventData event) {
        if (event == null) {
            throw new IllegalArgumentException("Event data is required to resolve a ticket type");
        }

        Map<String, EventTicketType> ticketTypes = event.getEventTicketTypes();
        if (ticketTypes == null || ticketTypes.isEmpty()) {
            throw new IllegalStateException(
                    "Event " + event.getEventId() + " has no eventTicketTypes");
        }

        EventTicketType ticketType = findByName(ticketTypes, GENERAL_TICKET_TYPE_NAME);
        if (ticketType == null) {
            ticketType = ticketTypes.values().iterator().next();
        }

        return toResolved(ticketType, false);
    }

    /**
     * Throws {@link CheckoutVacancyException} if insufficient vacancy.
     */
    public static void validateAvailability(ResolvedEventTicketType type, int quantity)
            throws CheckoutVacancyException {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be a positive integer: " + quantity);
        }
        Integer vacancy = type.getVacancy();
        if (vacancy == null) {
            throw new IllegalStateException("Ticket type " + type.getId() + " is missing vacancy");
        }
        if (vacancy < quantity) {
            throw new CheckoutVacancyException(String.format(
                    "Insufficient tickets for type %s (%s): %d available, %d requested",
                    type.getId(), type.getName(), vacancy, quantity));
        }
    }

    /**
     * Sets {@code eventTicketTypeId} and {@code eventTicketTypeName} on a ticket.
     */
    public static void stampTicket(Ticket ticket, ResolvedEventTicketType type) {
        if (ticket == null || type == null) {
            throw new IllegalArgumentException("Ticket and resolved ticket type are required");
        }
        ticket.setEventTicketTypeId(type.getId());
        ticket.setEventTicketTypeName(type.getName());
    }

    public static boolean isGeneralAdmissionName(@Nullable String name) {
        return GENERAL_TICKET_TYPE_NAME.equals(name);
    }

    /**
     * Prefer the ticket type's formId when set. Only General Admission falls back to the
     * event-level formId when unset; other ticket types with a null/blank formId use no form.
     */
    public static Optional<String> resolveFormId(EventData eventData, @Nullable String eventTicketTypeId) {
        if (eventData == null) {
            return Optional.empty();
        }
        Optional<String> eventFormId = Optional.ofNullable(eventData.getFormId())
                .filter(formId -> !formId.isBlank());
        if (eventTicketTypeId == null || eventTicketTypeId.isBlank()
                || eventData.getEventTicketTypes() == null) {
            return eventFormId;
        }

        EventTicketType ticketType = findById(eventData.getEventTicketTypes(), eventTicketTypeId);
        if (ticketType == null) {
            return eventFormId;
        }
        if (ticketType.getFormId() != null && !ticketType.getFormId().isBlank()) {
            return Optional.of(ticketType.getFormId());
        }
        if (isGeneralAdmissionName(ticketType.getName())) {
            return eventFormId;
        }
        return Optional.empty();
    }

    private static ResolvedEventTicketType toResolved(EventTicketType ticketType, boolean legacy) {
        return ResolvedEventTicketType.builder()
                .id(ticketType.getId())
                .name(ticketType.getName())
                .price(ticketType.getPrice())
                .vacancy(ticketType.getVacancy())
                .capacity(ticketType.getCapacity())
                .legacy(legacy)
                .build();
    }

    private static EventTicketType findByName(Map<String, EventTicketType> ticketTypes, String name) {
        for (EventTicketType ticketType : ticketTypes.values()) {
            if (ticketType != null && name.equals(ticketType.getName())) {
                return ticketType;
            }
        }
        return null;
    }

    private static EventTicketType findById(Map<String, EventTicketType> ticketTypes, String eventTicketTypeId) {
        EventTicketType byKey = ticketTypes.get(eventTicketTypeId);
        if (byKey != null) {
            return byKey;
        }
        for (EventTicketType ticketType : ticketTypes.values()) {
            if (ticketType != null && eventTicketTypeId.equals(ticketType.getId())) {
                return ticketType;
            }
        }
        return null;
    }
}
