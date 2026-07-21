package com.functions.events.services;

import java.util.Map;
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
 * Resolves the General Admission ticket type for purchase and inventory flows.
 * Prefers {@code eventTicketTypes}; falls back to top-level price/capacity/vacancy for
 * legacy events that have not been migrated yet.
 */
public class EventTicketTypeService {
    private static final Logger logger = LoggerFactory.getLogger(EventTicketTypeService.class);

    public static final String GENERAL_TICKET_TYPE_NAME = "General Admission";

    private EventTicketTypeService() {
    }

    /**
     * Always resolves to the General Admission ticket type for the event.
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

            return ResolvedEventTicketType.builder()
                    .id(general.getId())
                    .name(general.getName())
                    .price(general.getPrice())
                    .vacancy(general.getVacancy())
                    .capacity(general.getCapacity())
                    .build();
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
                .build();
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

    private static EventTicketType findByName(Map<String, EventTicketType> ticketTypes, String name) {
        for (EventTicketType ticketType : ticketTypes.values()) {
            if (ticketType != null && name.equals(ticketType.getName())) {
                return ticketType;
            }
        }
        return null;
    }
}
