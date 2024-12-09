package com.functions.events.models;

import com.functions.events.models.NewEventData;

import com.functions.events.models.RecurrenceData;
import lombok.Data;

@Data
public class RecurringEvent {
	private NewEventData eventData;
	private RecurrenceData recurrenceData;
}
