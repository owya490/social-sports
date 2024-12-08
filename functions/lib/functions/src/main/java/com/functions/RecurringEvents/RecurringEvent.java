package com.functions.RecurringEvents;

import com.functions.Events.NewEventData;

import lombok.Data;

@Data
public class RecurringEvent {
	private NewEventData eventData;
	private RecurrenceData recurrenceData;
}
