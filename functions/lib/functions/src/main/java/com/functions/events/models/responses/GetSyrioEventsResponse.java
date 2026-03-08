package com.functions.events.models.responses;

import java.util.List;

import com.functions.events.models.EventData;

/**
 * Response containing the list of Syrio events.
 */
public record GetSyrioEventsResponse(
    List<EventData> events
) {}
