package com.functions.attendee.handlers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.attendee.models.requests.SetAttendeeTicketsRequest;
import com.functions.attendee.models.responses.SetAttendeeTicketsResponse;
import com.functions.attendee.services.AttendeeService;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;

public class SetAttendeeTicketsHandler implements Handler<SetAttendeeTicketsRequest, SetAttendeeTicketsResponse> {
    private static final Logger logger = LoggerFactory.getLogger(SetAttendeeTicketsHandler.class);

    @Override
    public SetAttendeeTicketsRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), SetAttendeeTicketsRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse SetAttendeeTicketsRequest", e);
        }
    }

    @Override
    public SetAttendeeTicketsResponse handle(SetAttendeeTicketsRequest request) throws Exception {
        logger.info("Handling set attendee tickets for orderId: {}, eventId: {}, numTickets: {}",
                request.orderId(), request.eventId(), request.numTickets());

        if (request.eventId() == null || request.eventId().isBlank()) {
            throw new IllegalArgumentException("eventId is required");
        }
        if (request.orderId() == null || request.orderId().isBlank()) {
            throw new IllegalArgumentException("orderId is required");
        }
        if (request.numTickets() < 0) {
            throw new IllegalArgumentException("numTickets cannot be negative");
        }

        SetAttendeeTicketsResponse response = AttendeeService.setAttendeeTickets(request);

        logger.info("Set attendee tickets completed: orderId={}, success={}", response.orderId(), response.success());
        return response;
    }
}
