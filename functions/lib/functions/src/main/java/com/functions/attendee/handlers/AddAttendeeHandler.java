package com.functions.attendee.handlers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.attendee.models.requests.AddAttendeeRequest;
import com.functions.attendee.models.responses.AddAttendeeResponse;
import com.functions.attendee.services.AttendeeService;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;

public class AddAttendeeHandler implements Handler<AddAttendeeRequest, AddAttendeeResponse> {
    private static final Logger logger = LoggerFactory.getLogger(AddAttendeeHandler.class);

    @Override
    public AddAttendeeRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), AddAttendeeRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse AddAttendeeRequest", e);
        }
    }

    @Override
    public AddAttendeeResponse handle(AddAttendeeRequest request) throws Exception {
        logger.info("Handling add attendee for eventId: {}, email: {}", request.eventId(), request.email());

        if (request.eventId() == null || request.eventId().isBlank()) {
            throw new IllegalArgumentException("eventId is required");
        }
        if (request.email() == null || request.email().isBlank()) {
            throw new IllegalArgumentException("email is required");
        }
        if (request.numTickets() <= 0) {
            throw new IllegalArgumentException("numTickets must be greater than 0");
        }

        AddAttendeeResponse response = AttendeeService.addAttendee(request);

        logger.info("Add attendee completed: orderId={}, ticketCount={}", response.orderId(),
                response.ticketIds().size());
        return response;
    }
}
