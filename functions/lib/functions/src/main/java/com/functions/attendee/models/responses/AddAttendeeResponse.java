package com.functions.attendee.models.responses;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AddAttendeeResponse(
        @JsonProperty("orderId") String orderId,
        @JsonProperty("ticketIds") List<String> ticketIds) {
}
