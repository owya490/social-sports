package com.functions.attendee.models.requests;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GetEventAttendeeNamesRequest(
        @JsonProperty("eventId") String eventId) {
}
