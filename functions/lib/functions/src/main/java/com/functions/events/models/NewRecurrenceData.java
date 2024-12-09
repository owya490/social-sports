package com.functions.events.models;

import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

@Value
@Builder(toBuilder = true)
@Jacksonized
public class NewRecurrenceData {
    RecurrenceData.Frequency frequency;
    Integer recurrenceAmount;
    Integer createDaysBefore;
    Boolean recurrenceEnabled;
}
