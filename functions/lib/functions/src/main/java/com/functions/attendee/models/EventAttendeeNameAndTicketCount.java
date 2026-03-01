package com.functions.attendee.models;

import com.fasterxml.jackson.annotation.JsonProperty;

public record EventAttendeeNameAndTicketCount(
        @JsonProperty("name") String name,
        @JsonProperty("ticketCount") int ticketCount) {
}
