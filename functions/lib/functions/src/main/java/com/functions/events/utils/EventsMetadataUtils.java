package com.functions.events.utils;

import java.util.ArrayList;
import java.util.HashMap;

import com.functions.events.models.EventMetadata;
import com.functions.events.models.NewEventData;
import com.functions.events.models.Purchaser;

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
