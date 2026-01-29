package com.functions.events.models;

import java.util.List;
import java.util.Map;

import lombok.Data;

@Data
public class EventMetadata {
	private Map<String, Purchaser> purchaserMap;
	private Integer completeTicketCount;
	private List<String> completedStripeCheckoutSessionIds;
	private String organiserId;
	private List<String> orderIds;
}
