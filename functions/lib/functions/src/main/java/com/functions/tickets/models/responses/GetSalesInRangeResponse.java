package com.functions.tickets.models.responses;

import java.util.List;

import com.functions.tickets.models.Order;
import com.functions.tickets.models.Ticket;

public record GetSalesInRangeResponse(List<Order> orders, List<Ticket> tickets) {
}
