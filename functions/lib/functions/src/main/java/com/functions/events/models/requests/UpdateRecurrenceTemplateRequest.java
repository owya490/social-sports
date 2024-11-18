package com.functions.events.models.requests;

import com.functions.events.models.NewEventData;
import com.functions.events.models.NewRecurrenceData;

public record UpdateRecurrenceTemplateRequest(
        String recurrenceTemplateId,
        NewEventData eventData,
        NewRecurrenceData recurrenceData
){}
