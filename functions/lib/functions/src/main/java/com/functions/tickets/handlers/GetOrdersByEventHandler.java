package com.functions.tickets.handlers;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.tickets.models.Order;
import com.functions.tickets.models.Ticket;
import com.functions.tickets.models.requests.get.GetOrdersByEventRequest;
import com.functions.tickets.models.responses.get.GetOrdersByEventResponse;
import com.functions.tickets.services.TicketsService;
import com.functions.utils.JavaUtils;

public class GetOrdersByEventHandler implements Handler<GetOrdersByEventRequest, GetOrdersByEventResponse> {
    private static final Logger logger = LoggerFactory.getLogger(GetOrdersByEventHandler.class);

    @Override
    public GetOrdersByEventRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), GetOrdersByEventRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse GetOrdersByEventRequest", e);
        }
    }

    @Override
    public GetOrdersByEventResponse handle(GetOrdersByEventRequest request) throws Exception {
        logger.info("Getting orders for eventId: {}", request.eventId());

        if (request.eventId() == null || request.eventId().isBlank()) {
            throw new IllegalArgumentException("eventId is required");
        }

        Map<Order, List<Ticket>> orderTicketsMap = TicketsService.getOrdersAndTicketsByEventId(request.eventId());

        logger.info("Found {} orders for eventId: {}", orderTicketsMap.size(), request.eventId());
        return GetOrdersByEventResponse.fromMap(orderTicketsMap);
    }
}
