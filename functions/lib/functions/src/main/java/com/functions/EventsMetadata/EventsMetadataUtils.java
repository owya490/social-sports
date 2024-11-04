package com.functions.EventsMetadata;

import java.util.ArrayList;
import java.util.HashMap;

import com.functions.Events.NewEventData;

public class EventsMetadataUtils {
	public static EventMetadata extractEventsMetadataFieldsForNewEvent(NewEventData eventData) {
		EventMetadata eventMetadata = new EventMetadata();
		eventMetadata.setPurchaserMap(new HashMap<String, Purchaser>());
		eventMetadata.setCompletedStripeCheckoutSession(new ArrayList<String>());
		eventMetadata.setOrganiserId(eventData.getOrganiserId());
		eventMetadata.setCompleteTicketCount(0);
		eventMetadata.setOrderIds(new ArrayList<String>());
		return eventMetadata;
	}
}
