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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Events implements HttpFunction {
	    private static final Logger logger = LoggerFactory.getLogger(Events.class);

		private static final String ACCESS_ALLOW_ORIGIN_HEADER = "Access-Control-Allow-Origin";
		private static final String ACCESS_ALLOW_METHODS_HEADER = "Access-Control-Allow-Methods";
		private static final String ACCESS_ALLOW_HEADERS_HEADER = "Access-Control-Allow-Headers";

	/**
	 * Create a new event in firebase with a transaction.
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
		data.setNameTokens(EventsUtils.tokenizeText(data.getName()));
		data.setLocationTokens(EventsUtils.tokenizeText(data.getLocation()));

		transaction.set(newEventDocRef, JavaUtils.toMap(data));
		EventsMetadata.createEventMetadata(transaction, newEventDocRef.getId(), data);
		EventsUtils.addEventIdToUserOrganiserEvents(data.getOrganiserId(), newEventDocRef.getId());
		return newEventDocRef.getId();
	}

	@Override
	public void service(HttpRequest request, HttpResponse response) throws Exception {
		// response.appendHeader(ACCESS_ALLOW_ORIGIN_HEADER, "https://www.sportshub.net.au");
        // response.appendHeader(ACCESS_ALLOW_ORIGIN_HEADER, "http://localhost:3000");
        // response.appendHeader(ACCESS_ALLOW_METHODS_HEADER, "GET");
        // response.appendHeader(ACCESS_ALLOW_HEADERS_HEADER, "Content-Type");

		// if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
		// 	response.setStatusCode(204); // No Content
		// 	return;
		// }

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
