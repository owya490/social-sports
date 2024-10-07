package com.functions.EventsMetadata;

import com.functions.FirebaseService;
import com.functions.Events.NewEventData;
import com.functions.FirebaseService.CollectionPaths;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;

public class EventsMetadata {
	public static void createEventMetadata(Transaction transaction, String eventId, NewEventData data) {
		Firestore db = FirebaseService.getFirestore();
		EventMetadata eventMetadata = EventsMetadataUtils.extractEventsMetadataFieldsForNewEvent(data);
		DocumentReference eventMetadataDocRef = db.collection(CollectionPaths.EVENTS_METADATA).document(eventId);

		transaction.set(eventMetadataDocRef, eventMetadata);
	}
}
