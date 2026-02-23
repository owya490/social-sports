package com.functions.tickets.handlers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.tickets.models.requests.create.CreateOrderRequest;
import com.functions.tickets.models.responses.create.CreateOrderResponse;
import com.functions.tickets.services.TicketsService;
import com.functions.utils.JavaUtils;

public class CreateOrderHandler implements Handler<CreateOrderRequest, CreateOrderResponse> {
    private static final Logger logger = LoggerFactory.getLogger(CreateOrderHandler.class);

    @Override
    public CreateOrderRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), CreateOrderRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse CreateOrderRequest", e);
        }
    }

    @Override
    public CreateOrderResponse handle(CreateOrderRequest request) throws Exception {
        logger.info("Creating order for eventId: {}, email: {}", request.eventId(), request.email());

        if (request.eventId() == null || request.eventId().isBlank()) {
            throw new IllegalArgumentException("eventId is required");
        }
        if (request.tickets() == null || request.tickets().isEmpty()) {
            throw new IllegalArgumentException("At least one ticket is required");
        }

        CreateOrderResponse response = TicketsService.createOrderWithTickets(request);

        logger.info("Order created successfully: orderId={}, ticketCount={}", response.orderId(), response.ticketIds().size());
        return response;
    }
}
