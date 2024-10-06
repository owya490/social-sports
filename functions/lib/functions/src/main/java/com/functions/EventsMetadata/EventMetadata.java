package com.functions.EventsMetadata;

import java.util.List;
import java.util.Map;

import lombok.Data;

@Data
public class EventMetadata {
	private String eventId;
	private Map<String, Purchaser> purchaserMap;
	private Integer completeTicketCount;
	private List<String> completedStripeCheckoutSession;
	private String organiserId;
	private List<String> orderIds;
}
