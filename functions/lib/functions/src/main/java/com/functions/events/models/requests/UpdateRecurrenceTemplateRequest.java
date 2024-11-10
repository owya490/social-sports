package com.functions.events.models.requests;

import com.functions.events.models.NewEventData;
import com.functions.events.models.NewRecurrenceData;
import lombok.Value;

@Value
public class UpdateRecurrenceTemplateRequest {
    String recurrenceTemplateId;
    NewEventData eventData;
    NewRecurrenceData recurrenceData;
}
