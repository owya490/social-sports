package com.functions.events.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

import java.util.ArrayList;
import java.util.List;

@Value
@Builder(toBuilder = true)
@Jacksonized
@JsonIgnoreProperties(ignoreUnknown = true)
public class NewRecurrenceData {
    RecurrenceData.Frequency frequency;
    Integer recurrenceAmount;
    Integer createDaysBefore;
    Boolean recurrenceEnabled;
    @Builder.Default
    List<ReservedSlot> reservedSlots = new ArrayList<>(); // Reserved slots for specific emails
}
