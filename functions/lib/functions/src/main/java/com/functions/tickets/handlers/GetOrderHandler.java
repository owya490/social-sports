package com.functions.tickets.handlers;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.tickets.models.Order;
import com.functions.tickets.models.Ticket;
import com.functions.tickets.models.requests.get.GetOrderRequest;
import com.functions.tickets.models.responses.get.GetOrderResponse;
import com.functions.tickets.repositories.OrdersRepository;
import com.functions.tickets.repositories.TicketsRepository;
import com.functions.utils.JavaUtils;

public class GetOrderHandler implements Handler<GetOrderRequest, GetOrderResponse> {
    private static final Logger logger = LoggerFactory.getLogger(GetOrderHandler.class);

    @Override
    public GetOrderRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), GetOrderRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse GetOrderRequest", e);
        }
    }

    @Override
    public GetOrderResponse handle(GetOrderRequest request) throws Exception {
        logger.info("Getting order: {}", request.orderId());

        if (request.orderId() == null || request.orderId().isBlank()) {
            throw new IllegalArgumentException("orderId is required");
        }

        Order order = OrdersRepository.getOrderById(request.orderId())
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + request.orderId()));

        List<Ticket> tickets = TicketsRepository.getTicketsByIds(order.getTickets());

        return new GetOrderResponse(order, tickets);
    }
}
