package com.functions.events.models;

import java.util.Map;

import lombok.Data;

@Data
public class Purchaser {
	private String email;
	private Map<String, Attendee> attendees;
	private Integer totalTicketCount;
}
