package com.functions.tickets.models.responses.get;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.functions.tickets.models.Order;
import com.functions.tickets.models.Ticket;

public record GetOrderResponse(
        @JsonProperty("order") Order order,
        @JsonProperty("tickets") List<Ticket> tickets) {
}
