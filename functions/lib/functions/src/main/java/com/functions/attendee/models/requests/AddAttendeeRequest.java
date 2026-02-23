package com.functions.attendee.models.requests;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AddAttendeeRequest(
        @JsonProperty("eventId") String eventId,
        @JsonProperty("email") String email,
        @JsonProperty("fullName") String fullName,
        @JsonProperty("phone") String phone,
        @JsonProperty("numTickets") int numTickets,
        @JsonProperty("price") long price) {
}
