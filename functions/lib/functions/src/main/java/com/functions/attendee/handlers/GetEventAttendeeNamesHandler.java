package com.functions.attendee.handlers;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.attendee.models.EventAttendeeNameAndTicketCount;
import com.functions.attendee.models.requests.GetEventAttendeeNamesRequest;
import com.functions.attendee.models.responses.GetEventAttendeeNamesResponse;
import com.functions.events.models.EventData;
import com.functions.events.models.EventMetadata;
import com.functions.events.repositories.EventsRepository;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.tickets.models.Order;
import com.functions.tickets.models.OrderAndTicketStatus;
import com.functions.tickets.repositories.OrdersRepository;
import com.functions.utils.JavaUtils;

public class GetEventAttendeeNamesHandler implements Handler<GetEventAttendeeNamesRequest, GetEventAttendeeNamesResponse> {
    private static final Logger logger = LoggerFactory.getLogger(GetEventAttendeeNamesHandler.class);

    @Override
    public GetEventAttendeeNamesRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), GetEventAttendeeNamesRequest.class);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Failed to parse GetEventAttendeeNamesRequest", e);
        }
    }

    @Override
    public GetEventAttendeeNamesResponse handle(GetEventAttendeeNamesRequest request) {
        String eventId = request.eventId();
        if (eventId == null || eventId.isBlank()) {
            logger.warn("GetEventAttendeeNames rejected: eventId is null or blank");
            throw new IllegalArgumentException("eventId is required and must be non-empty");
        }

        logger.info("Handling get event attendee names for eventId: {}", eventId);

        Optional<EventData> eventOptional = EventsRepository.getEventById(eventId);
        if (eventOptional.isEmpty()) {
            logger.warn("Event not found: {}", eventId);
            throw new RuntimeException("Event not found: " + eventId);
        }

        EventData event = eventOptional.get();
        if (event.getShowAttendeesOnEventPage() == null || !event.getShowAttendeesOnEventPage()) {
            logger.info("showAttendeesOnEventPage is disabled for eventId: {}, returning empty list", eventId);
            return new GetEventAttendeeNamesResponse(Collections.emptyList());
        }

        Optional<EventMetadata> metadataOptional = EventsRepository.getEventMetadataById(eventId);
        if (metadataOptional.isEmpty()) {
            logger.info("No event metadata for eventId: {}, returning empty list", eventId);
            return new GetEventAttendeeNamesResponse(Collections.emptyList());
        }

        EventMetadata metadata = metadataOptional.get();
        List<String> orderIds = metadata.getOrderIds();
        if (orderIds == null || orderIds.isEmpty()) {
            return new GetEventAttendeeNamesResponse(Collections.emptyList());
        }

        List<Order> orders = OrdersRepository.getOrdersByIds(orderIds);
        List<EventAttendeeNameAndTicketCount> attendees = new ArrayList<>();

        for (Order order : orders) {
            if (order.getStatus() == OrderAndTicketStatus.APPROVED) {
                String fullName = order.getFullName();
                if (fullName != null && !fullName.isBlank()) {
                    int ticketCount = order.getTickets() != null ? order.getTickets().size() : 1;
                    attendees.add(new EventAttendeeNameAndTicketCount(fullName.trim(), ticketCount));
                }
            }
        }

        logger.info("Returning {} attendees for eventId: {}", attendees.size(), eventId);
        return new GetEventAttendeeNamesResponse(attendees);
    }
}
