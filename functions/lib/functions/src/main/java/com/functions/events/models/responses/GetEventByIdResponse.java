package com.functions.events.models.responses;

import com.functions.events.models.EventData;

/**
 * Response containing a single event by ID.
 */
public record GetEventByIdResponse(
    EventData event
) {}
