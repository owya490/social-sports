package com.functions.events.models;

import lombok.Builder;
import lombok.Value;

@Value
@Builder(toBuilder = true)
public class NewRecurrenceData {
    RecurrenceData.Frequency frequency;
    Integer recurrenceAmount;
    Integer createDaysBefore;
    Boolean recurrenceEnabled;
}
