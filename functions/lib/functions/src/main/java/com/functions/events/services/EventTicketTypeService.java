package com.functions.events.services;

import java.util.Map;
import java.util.Objects;
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
 * Resolves event ticket types for purchase and inventory flows.
 * Defaults to the General ticket type when no type ID is provided.
 *
 * <p>For General (and legacy sole-map defaults), price/capacity/vacancy always mirror the
 * event's top-level fields so stale {@code eventTicketTypes} maps from the rollout period
 * cannot diverge from organiser edits.
 */
public class EventTicketTypeService {
    private static final Logger logger = LoggerFactory.getLogger(EventTicketTypeService.class);

    public static final String GENERAL_TICKET_TYPE_NAME = "General";
    /** Legacy name used by older frontend event create helpers. */
    public static final String LEGACY_GENERAL_ADMISSION_NAME = "General Admission";

    private EventTicketTypeService() {
    }

    /**
     * Resolve a ticket type for a purchase. Null/blank {@code eventTicketTypeId} → General.
     * General-like types always use top-level price/capacity/vacancy.
     */
    public static ResolvedEventTicketType resolve(EventData event, @Nullable String eventTicketTypeId) {
        if (event == null) {
            throw new IllegalArgumentException("Event data is required to resolve a ticket type");
        }

        Map<String, EventTicketType> ticketTypes = event.getEventTicketTypes();

        if (eventTicketTypeId != null && !eventTicketTypeId.isBlank()) {
            EventTicketType explicit = ticketTypes != null ? ticketTypes.get(eventTicketTypeId) : null;
            if (explicit == null) {
                throw new IllegalArgumentException(
                        "Unknown eventTicketTypeId: " + eventTicketTypeId + " for event " + event.getEventId());
            }
            if (isGeneralLikeName(explicit.getName())) {
                return fromMapEntryMirroringTopLevel(event, explicit);
            }
            return fromEventTicketType(explicit, false, false);
        }

        if (ticketTypes != null && !ticketTypes.isEmpty()) {
            EventTicketType general = findByName(ticketTypes, GENERAL_TICKET_TYPE_NAME);
            if (general != null) {
                return fromMapEntryMirroringTopLevel(event, general);
            }

            EventTicketType legacyGeneral = findByName(ticketTypes, LEGACY_GENERAL_ADMISSION_NAME);
            if (legacyGeneral != null) {
                return fromMapEntryMirroringTopLevel(event, legacyGeneral);
            }

            if (ticketTypes.size() == 1) {
                EventTicketType only = ticketTypes.values().iterator().next();
                logger.info("Resolving sole ticket type '{}' for event {} (mirroring top-level fields)",
                        only.getName(), event.getEventId());
                return fromMapEntryMirroringTopLevel(event, only);
            }

            throw new IllegalStateException(
                    "Event " + event.getEventId()
                            + " has multiple ticket types but no General ticket type to default to");
        }

        logger.info("Synthesizing General ticket type from top-level fields for event {}", event.getEventId());
        return ResolvedEventTicketType.builder()
                .id(UUID.nameUUIDFromBytes(("legacy-general:" + event.getEventId()).getBytes()).toString())
                .name(GENERAL_TICKET_TYPE_NAME)
                .price(event.getPrice())
                .vacancy(event.getVacancy())
                .capacity(event.getCapacity())
                .synthesized(true)
                .mirrorsTopLevel(true)
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

    public static boolean isGeneralLikeName(@Nullable String name) {
        return GENERAL_TICKET_TYPE_NAME.equals(name) || LEGACY_GENERAL_ADMISSION_NAME.equals(name);
    }

    private static EventTicketType findByName(Map<String, EventTicketType> ticketTypes, String name) {
        for (EventTicketType ticketType : ticketTypes.values()) {
            if (ticketType != null && name.equals(ticketType.getName())) {
                return ticketType;
            }
        }
        return null;
    }

    /**
     * Keep map entry identity (id/name) but force price/capacity/vacancy from top-level event fields.
     */
    private static ResolvedEventTicketType fromMapEntryMirroringTopLevel(EventData event,
            EventTicketType ticketType) {
        if (!Objects.equals(ticketType.getPrice(), event.getPrice())
                || !Objects.equals(ticketType.getCapacity(), event.getCapacity())
                || !Objects.equals(ticketType.getVacancy(), event.getVacancy())) {
            logger.info(
                    "Reconciling stale ticket type {} for event {}: map(price={}, capacity={}, vacancy={}) "
                            + "→ topLevel(price={}, capacity={}, vacancy={})",
                    ticketType.getId(), event.getEventId(),
                    ticketType.getPrice(), ticketType.getCapacity(), ticketType.getVacancy(),
                    event.getPrice(), event.getCapacity(), event.getVacancy());
        }
        return ResolvedEventTicketType.builder()
                .id(ticketType.getId())
                .name(ticketType.getName())
                .price(event.getPrice())
                .vacancy(event.getVacancy())
                .capacity(event.getCapacity())
                .synthesized(false)
                .mirrorsTopLevel(true)
                .build();
    }

    private static ResolvedEventTicketType fromEventTicketType(EventTicketType ticketType, boolean synthesized,
            boolean mirrorsTopLevel) {
        return ResolvedEventTicketType.builder()
                .id(ticketType.getId())
                .name(ticketType.getName())
                .price(ticketType.getPrice())
                .vacancy(ticketType.getVacancy())
                .capacity(ticketType.getCapacity())
                .synthesized(synthesized)
                .mirrorsTopLevel(mirrorsTopLevel)
                .build();
    }
}
