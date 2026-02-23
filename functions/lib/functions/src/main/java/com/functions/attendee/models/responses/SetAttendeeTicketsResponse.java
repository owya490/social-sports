package com.functions.attendee.models.responses;

import com.fasterxml.jackson.annotation.JsonProperty;

public record SetAttendeeTicketsResponse(
        @JsonProperty("orderId") String orderId,
        @JsonProperty("success") boolean success,
        @JsonProperty("message") String message) {
}
