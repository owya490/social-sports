package com.functions.events.handlers;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.events.models.EventData;
import com.functions.events.models.requests.GetEventByIdRequest;
import com.functions.events.models.responses.GetEventByIdResponse;
import com.functions.events.repositories.EventsRepository;
import com.functions.global.exceptions.NotFoundException;
import com.functions.global.models.AuthContext;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;

/**
 * Handler for getting a single event by ID.
 * Validates that the event exists, is active, and is public before returning.
 */
public class GetEventByIdHandler implements Handler<GetEventByIdRequest, GetEventByIdResponse> {
    private static final Logger logger = LoggerFactory.getLogger(GetEventByIdHandler.class);

    @Override
    public GetEventByIdRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), GetEventByIdRequest.class);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Failed to parse GetEventByIdRequest", e);
        }
    }

    @Override
    public GetEventByIdResponse handle(GetEventByIdRequest request, AuthContext authContext) {
        if (request == null || request.eventId() == null || request.eventId().isBlank()) {
            throw new IllegalArgumentException("eventId is required and must be non-empty");
        }

        String eventId = request.eventId();
        logger.info("Handling get event by ID request for eventId: {}", eventId);

        EventData event = find(eventId)
                .orElseThrow(() -> new NotFoundException("Event not found: " + eventId));
        if (!Boolean.TRUE.equals(event.getIsActive()) || !Boolean.FALSE.equals(event.getIsPrivate())) {
            throw new IllegalStateException("Event at active public path has inconsistent status: " + eventId);
        }

        logger.info("Successfully retrieved event: {}", eventId);
        return new GetEventByIdResponse(event);
    }

    protected Optional<EventData> find(String eventId) {
        return EventsRepository.getActivePublicEventById(eventId);
    }
}
