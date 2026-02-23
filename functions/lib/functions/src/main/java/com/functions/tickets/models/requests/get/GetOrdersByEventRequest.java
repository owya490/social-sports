package com.functions.tickets.models.requests.get;

import com.fasterxml.jackson.annotation.JsonProperty;

public record GetOrdersByEventRequest(
        @JsonProperty("eventId") String eventId) {
}
