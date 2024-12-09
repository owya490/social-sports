package com.functions.events.models.requests;

import com.functions.events.models.NewEventData;
import com.functions.events.models.NewRecurrenceData;

public record CreateRecurrenceTemplateRequest(NewEventData eventData, NewRecurrenceData recurrenceData) {}
