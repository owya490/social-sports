package com.functions.events.models;

import lombok.*;

@Value
@Builder(toBuilder = true)
@NoArgsConstructor(force = true, access = AccessLevel.PRIVATE)
@AllArgsConstructor
public class RecurrenceTemplate {
    NewEventData eventData;
    RecurrenceData recurrenceData;
}
