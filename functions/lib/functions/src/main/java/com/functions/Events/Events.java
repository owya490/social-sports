package com.functions.Events;

import com.functions.FirebaseService;
import com.functions.JavaUtils;
import com.functions.EventsMetadata.EventsMetadata;
import com.functions.FirebaseService.CollectionPaths;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;

import java.util.Map;

public class Events {
	/**
	 * Will be callable from firebase functions.
	 * 
	 * @param data data of the new event.
	 * @return
	 */
	public static String createEvent(NewEventData data) {
		Firestore db = FirebaseService.getFirestore();
		String newEventId = db.runTransaction(transaction -> {
			return createEventInternal(data, transaction);
		}).toString();
		return newEventId;
	}

	/**
	 * Internal implementation to create a new event in firebase with a transaction.
	 * 
	 * @param data        data of the new event.
	 * @param transaction
	 */
	public static String createEventInternal(NewEventData data, Transaction transaction) throws Exception {
		Firestore db = FirebaseService.getFirestore();
		String isActive = data.getIsActive() ? CollectionPaths.ACTIVE : CollectionPaths.INACTIVE;
		String isPrivate = data.getIsPrivate() ? CollectionPaths.PRIVATE : CollectionPaths.PUBLIC;
		DocumentReference newEventDocRef = db.collection(CollectionPaths.EVENTS).document(isActive)
				.collection(isPrivate)
				.document();

		Map<String, Object> eventDataWithTokens = JavaUtils.toMap(data);
		eventDataWithTokens.put("nameTokens", EventsUtils.tokenizeText(data.getName()));
		eventDataWithTokens.put("locationTokens", EventsUtils.tokenizeText(data.getLocation()));

		transaction.set(newEventDocRef, eventDataWithTokens);
		EventsMetadata.createEventMetadata(transaction, newEventDocRef.getId(), data);
		EventsUtils.addEventIdToUserOrganiserEvents(data.getOrganiserId(), newEventDocRef.getId());
		return newEventDocRef.getId();
	}
}
