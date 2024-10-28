package com.functions.Events;

import com.functions.FirebaseService;
import com.functions.JavaUtils;
import com.functions.EventsMetadata.EventsMetadata;
import com.functions.FirebaseService.CollectionPaths;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Events implements HttpFunction {
	    private static final Logger logger = LoggerFactory.getLogger(Events.class);

		// TODO: need recurring template name
		// TODO: need to have createEvent send email (call python function)

		// TODO: remove this as it is unused.
	/**
	 * Will be callable from firebase functions.
	 * 
	 * @param data data of the new event.
	 * @return
	 */
	// public static String createEvent(NewEventData data) {
	// 	Firestore db = FirebaseService.getFirestore();
	// 	String newEventId = db.runTransaction(transaction -> {
	// 		return createEventInternal(data, transaction);
	// 	}).toString();
	// 	return newEventId;
	// }

	/**
	 * Internal implementation to create a new event in firebase with a transaction.
	 * 
	 * @param data        data of the new event.
	 * @param transaction
	 */
	public static String createEvent(NewEventData data, Transaction transaction) throws Exception {
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

	@Override
	public void service(HttpRequest request, HttpResponse response) throws Exception {
		response.appendHeader("Access-Control-Allow-Origin", "https://www.sportshub.net.au");
        response.appendHeader("Access-Control-Allow-Origin", "http://localhost:3000");
        response.appendHeader("Access-Control-Allow-Methods", "GET");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type");

		if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
			response.setStatusCode(204); // No Content
			return;
		}

		if (!"POST".equalsIgnoreCase(request.getMethod())) {
            response.setStatusCode(405); // Method Not Allowed
            response.appendHeader("Allow", "POST");
            response.getWriter().write("This function only supports POST requests.");
            return;
        }

		NewEventData data;
		try {
			data = JavaUtils.objectMapper.readValue(request.getReader(), NewEventData.class);
		} catch (Exception e) {
			response.setStatusCode(400);
			response.getWriter().write("Invalid request data: " + e);
			return;
		}

		Firestore db = FirebaseService.getFirestore();
	
		try {
			String eventId = db.runTransaction(transaction -> {
				return createEvent(data, transaction);
			}).get();
	
			response.setStatusCode(200);
			response.getWriter().write("Event created successfully with ID: " + eventId + "\n");
		} catch (Exception e) {
			response.setStatusCode(500);
			response.getWriter().write("Error creating event: " + e.getMessage());
		}
	}
}
