package com.functions.events.handlers;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.events.models.EventData;
import com.functions.events.models.requests.GetEventByIdRequest;
import com.functions.events.models.responses.GetEventByIdResponse;
import com.functions.events.repositories.EventsRepository;
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
            throw new RuntimeException("Failed to parse GetEventByIdRequest", e);
        }
    }

    @Override
    public GetEventByIdResponse handle(GetEventByIdRequest request) {
        logger.info("Handling get event by ID request for eventId: {}", request.eventId());

        try {
            Optional<EventData> eventOptional = EventsRepository.getEventById(request.eventId());
            
            if (eventOptional.isEmpty()) {
                logger.warn("Event not found: {}", request.eventId());
                throw new RuntimeException("Event not found: " + request.eventId());
            }

            EventData event = eventOptional.get();

            // Validate the event is active
            if (event.getIsActive() == null || !event.getIsActive()) {
                logger.warn("Event is not active: {}", request.eventId());
                throw new RuntimeException("Event is not active: " + request.eventId());
            }

            // Validate the event is public
            if (event.getIsPrivate() != null && event.getIsPrivate()) {
                logger.warn("Event is private: {}", request.eventId());
                throw new RuntimeException("Event is private: " + request.eventId());
            }

            logger.info("Successfully retrieved event: {}", request.eventId());
            return new GetEventByIdResponse(event);
        } catch (RuntimeException e) {
            logger.error("Failed to get event by ID: {}", request.eventId(), e);
            throw e;
        }
    }
}
