package com.functions.tickets.models.responses.get;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.functions.tickets.models.Order;
import com.functions.tickets.models.Ticket;

public record GetOrdersByEventResponse(
        @JsonProperty("orders") List<OrderWithTickets> orders) {

    public record OrderWithTickets(
            @JsonProperty("order") Order order,
            @JsonProperty("tickets") List<Ticket> tickets) {
    }

    public static GetOrdersByEventResponse fromMap(Map<Order, List<Ticket>> orderTicketsMap) {
        List<OrderWithTickets> entries = orderTicketsMap.entrySet().stream()
                .map(e -> new OrderWithTickets(e.getKey(), e.getValue()))
                .toList();
        return new GetOrdersByEventResponse(entries);
    }
}
