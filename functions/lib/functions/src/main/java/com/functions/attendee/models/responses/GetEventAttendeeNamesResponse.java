package com.functions.attendee.models.responses;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.functions.attendee.models.EventAttendeeNameAndTicketCount;

public record GetEventAttendeeNamesResponse(
        @JsonProperty("attendees") List<EventAttendeeNameAndTicketCount> attendees) {
}
