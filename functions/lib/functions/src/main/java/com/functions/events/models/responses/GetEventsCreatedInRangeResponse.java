package com.functions.events.models.responses;

import java.util.List;

import com.functions.events.models.EventData;

public record GetEventsCreatedInRangeResponse(List<EventData> events) {
}
