package com.functions.events.models;

import lombok.Builder;
import lombok.Value;

@Value
@Builder(toBuilder = true)
public class RecurrenceTemplate {
    NewEventData eventData;
    RecurrenceData recurrenceData;
}
