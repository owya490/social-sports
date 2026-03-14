package com.functions.tickets.models.responses.create;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CreateOrderResponse(
        @JsonProperty("orderId") String orderId,
        @JsonProperty("ticketIds") List<String> ticketIds) {
}
