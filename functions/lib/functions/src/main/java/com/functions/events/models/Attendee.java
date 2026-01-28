package com.functions.events.models;

import java.util.ArrayList;
import java.util.List;

import lombok.Data;

@Data
public class Attendee {
	private String phone;
	private Integer ticketCount;
	private List<String> formResponseIds = new ArrayList<>();
}
