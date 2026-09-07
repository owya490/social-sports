package com.functions.events.models.requests;

import java.util.List;

import com.functions.events.models.NewEventData;
import com.functions.events.models.RecurrenceOccurrence;
import com.functions.events.models.ReservedSlot;

public record CreateRecurrenceTemplateV2Request(
        NewEventData eventData,
        List<RecurrenceOccurrence> occurrences,
        Boolean recurrenceEnabled,
        List<ReservedSlot> reservedSlots) {
}
