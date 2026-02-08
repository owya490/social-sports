package com.functions.events.handlers;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.events.models.EventData;
import com.functions.events.models.requests.GetSyrioEventsRequest;
import com.functions.events.models.responses.GetSyrioEventsResponse;
import com.functions.events.services.EventsService;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;

/**
 * Handler for getting Syrio events.
 */
public class GetSyrioEventsHandler implements Handler<GetSyrioEventsRequest, GetSyrioEventsResponse> {
    private static final Logger logger = LoggerFactory.getLogger(GetSyrioEventsHandler.class);
    private static final String SYRIO_ORGANISER_ID = "tihrtHXNCKVkYpmJIVijKDWkkvq2";

    @Override
    public GetSyrioEventsRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), GetSyrioEventsRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse GetSyrioEventsRequest", e);
        }
    }

    @Override
    public GetSyrioEventsResponse handle(GetSyrioEventsRequest request) {
        logger.info("Handling get Syrio events request");

        try {
            List<EventData> events = EventsService.getActivePublicEventsByOrganiser(SYRIO_ORGANISER_ID);
            logger.info("Successfully retrieved {} Syrio events", events.size());
            return new GetSyrioEventsResponse(events);
        } catch (Exception e) {
            logger.error("Failed to get Syrio events", e);
            throw new RuntimeException("Failed to get Syrio events: " + e.getMessage(), e);
        }
    }
}
