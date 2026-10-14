package com.functions.events.services;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventData;
import com.functions.events.models.EventTicketType;
import com.functions.events.models.ResolvedEventTicketType;
import com.functions.events.models.responses.GetPartnerEventsResponse;
import com.functions.events.models.responses.GetPartnerEventsResponse.PartnerEvent;
import com.functions.events.models.responses.GetPartnerEventsResponse.PartnerTicketType;
import com.functions.events.repositories.EventsRepository;
import com.google.cloud.Timestamp;

/**
 * Service for event-related business logic.
 */
public class EventsService {
    private static final Logger logger = LoggerFactory.getLogger(EventsService.class);

    public static GetPartnerEventsResponse getPublicPartnerEventsByOrganiser(String organiserId) {
        List<PartnerEvent> events = getActivePublicEventsByOrganiser(organiserId).stream()
                .map(event -> toPartnerEvent(event, organiserId))
                .sorted(Comparator.comparing(PartnerEvent::startDate).thenComparing(PartnerEvent::eventId))
                .collect(Collectors.toList());
        return new GetPartnerEventsResponse(events);
    }

    private static PartnerEvent toPartnerEvent(EventData event, String organiserId) {
        if (!Boolean.TRUE.equals(event.getIsActive()) || !Boolean.FALSE.equals(event.getIsPrivate())
                || !organiserId.equals(event.getOrganiserId())) {
            throw new IllegalStateException("Inconsistent public partner event: " + event.getEventId());
        }
        if (event.getEventId() == null || event.getEventId().isBlank()
                || event.getName() == null || event.getName().isBlank()
                || event.getEndDate() == null || event.getEndDate().compareTo(event.getStartDate()) < 0) {
            throw new IllegalStateException("Invalid required partner event fields: " + event.getEventId());
        }
        if (event.getMaxTicketsPerTransaction() != null && event.getMaxTicketsPerTransaction() <= 0) {
            throw new IllegalStateException("Invalid partner event ticket limit: " + event.getEventId());
        }
        List<String> tags = event.getEventTags();
        if (tags != null && tags.stream().anyMatch(Objects::isNull)) {
            throw new IllegalStateException("Invalid partner event tags: " + event.getEventId());
        }
        return new PartnerEvent(
                event.getEventId(), event.getName(),
                event.getDescription() == null ? "" : event.getDescription(),
                event.getLocation() == null ? "" : event.getLocation(),
                event.getStartDate(), event.getEndDate(), event.getRegistrationDeadline(),
                event.getImage(), event.getThumbnail(), tags == null ? List.of() : List.copyOf(tags),
                Boolean.TRUE.equals(event.getPaused()), Boolean.TRUE.equals(event.getPaymentsActive()),
                Boolean.TRUE.equals(event.getWaitlistEnabled()), Boolean.TRUE.equals(event.getBookingApprovalEnabled()),
                event.getMaxTicketsPerTransaction(), toPartnerTicketTypes(event));
    }

    private static List<PartnerTicketType> toPartnerTicketTypes(EventData event) {
        Map<String, EventTicketType> persistedTypes = event.getEventTicketTypes();
        if (persistedTypes == null || persistedTypes.isEmpty()) {
            return List.of();
        }
        List<PartnerTicketType> ticketTypes = new ArrayList<>();
        for (Map.Entry<String, EventTicketType> entry : persistedTypes.entrySet()) {
            EventTicketType persisted = entry.getValue();
            // Inventory writes use the stored ID as one segment in a dotted field path.
            if (persisted == null || persisted.getId() == null || persisted.getId().isBlank()
                    || !persisted.getId().equals(entry.getKey())
                    || persisted.getId().chars().anyMatch(character -> ".~*/[]".indexOf(character) >= 0)) {
                throw new IllegalStateException("Invalid persisted partner ticket ID: " + event.getEventId());
            }
            ResolvedEventTicketType type = EventTicketTypeService.resolveById(event, persisted.getId());
            if (type.getName() == null || type.getName().isBlank()
                    || type.getPrice() == null || type.getPrice() < 0 || type.getVacancy() == null) {
                throw new IllegalStateException("Invalid persisted partner ticket fields: " + event.getEventId());
            }
            ticketTypes.add(new PartnerTicketType(type.getId(), type.getName(), type.getPrice(), type.getVacancy() <= 0,
                    Boolean.TRUE.equals(event.getHideVacancy()) ? null : type.getVacancy()));
        }
        ticketTypes.sort(Comparator.comparingInt((PartnerTicketType type) ->
                EventTicketTypeService.isGeneralAdmissionName(type.name()) ? 0 : 1)
                .thenComparing(PartnerTicketType::name).thenComparing(PartnerTicketType::id));
        return List.copyOf(ticketTypes);
    }

    /**
     * Get active public events for a specific organiser.
     * Only returns future events, sorted by start date.
     *
     * @param organiserId the organiser's user ID
     * @return list of future events sorted by start date
     */
    public static List<EventData> getActivePublicEventsByOrganiser(String organiserId) {
        logger.info("Getting active public events for organiser: {}", organiserId);
        
        try {
            List<EventData> events = EventsRepository.getActivePublicEventsByOrganiser(organiserId);
            
            Timestamp now = Timestamp.now();
            List<EventData> futureEvents = events.stream()
                    .filter(event -> {
                        if (event.getStartDate() == null) {
                            logger.warn("Event {} has null startDate, excluding from results", 
                                event.getEventId() != null ? event.getEventId() : "unknown");
                            return false;
                        }
                        return event.getStartDate().compareTo(now) >= 0;
                    })
                    .sorted(Comparator.comparing(EventData::getStartDate))
                    .collect(Collectors.toList());
            
            logger.info("Found {} future events for organiser {} (filtered from {} total events)", 
                futureEvents.size(), organiserId, events.size());
            return futureEvents;
        } catch (Exception e) {
            logger.error("Error getting active public events for organiser: {}", organiserId, e);
            throw new RuntimeException("Failed to get events for organiser: " + organiserId, e);
        }
    }
}
