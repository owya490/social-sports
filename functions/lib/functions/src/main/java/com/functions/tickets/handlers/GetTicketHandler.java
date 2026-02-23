package com.functions.tickets.handlers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.tickets.models.Ticket;
import com.functions.tickets.models.requests.get.GetTicketRequest;
import com.functions.tickets.repositories.TicketsRepository;
import com.functions.utils.JavaUtils;

public class GetTicketHandler implements Handler<GetTicketRequest, Ticket> {
    private static final Logger logger = LoggerFactory.getLogger(GetTicketHandler.class);

    @Override
    public GetTicketRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), GetTicketRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse GetTicketRequest", e);
        }
    }

    @Override
    public Ticket handle(GetTicketRequest request) throws Exception {
        logger.info("Getting ticket: {}", request.ticketId());

        if (request.ticketId() == null || request.ticketId().isBlank()) {
            throw new IllegalArgumentException("ticketId is required");
        }

        return TicketsRepository.getTicketById(request.ticketId())
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + request.ticketId()));
    }
}
