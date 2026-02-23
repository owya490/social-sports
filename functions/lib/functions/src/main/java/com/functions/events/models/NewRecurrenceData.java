package com.functions.events.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class NewRecurrenceData {
    private RecurrenceData.Frequency frequency;
    private Integer recurrenceAmount;
    private Integer createDaysBefore;
    private Boolean recurrenceEnabled;
    private List<ReservedSlot> reservedSlots = new ArrayList<>();
}
