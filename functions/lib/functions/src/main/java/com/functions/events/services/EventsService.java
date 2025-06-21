package com.functions.events.services;

import com.functions.firebase.services.FirebaseService;
import com.functions.events.models.EventMetadata;
import com.functions.events.models.NewEventData;
import com.functions.events.utils.EventsMetadataUtils;
import com.functions.events.utils.EventsUtils;
import com.functions.utils.JavaUtils;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static com.functions.firebase.services.FirebaseService.CollectionPaths.*;

public class EventsService {
    private static final Logger logger = LoggerFactory.getLogger(EventsService.class);

    private static final String ACCESS_ALLOW_ORIGIN_HEADER = "Access-Control-Allow-Origin";
    private static final String ACCESS_ALLOW_METHODS_HEADER = "Access-Control-Allow-Methods";
    private static final String ACCESS_ALLOW_HEADERS_HEADER = "Access-Control-Allow-Headers";


    /**
     * Create a new event in firebase with a transaction.
     *
     * @param data        data of the new event.
     * @param transaction the firestore transaction object
     */
    public static String createEvent(NewEventData data, Transaction transaction) throws Exception {
        logger.info("Creating event: {}", data.getName());
        Firestore db = FirebaseService.getFirestore();
        String isActive = data.getIsActive() ? ACTIVE : INACTIVE;
        String isPrivate = data.getIsPrivate() ? PRIVATE : PUBLIC;
        DocumentReference newEventDocRef = db.collection(EVENTS).document(isActive)
                .collection(isPrivate)
                .document();
        data.setNameTokens(EventsUtils.tokenizeText(data.getName()));
        data.setLocationTokens(EventsUtils.tokenizeText(data.getLocation()));
        transaction.set(newEventDocRef, JavaUtils.toMap(data));
        createEventMetadata(transaction, newEventDocRef.getId(), data);
        EventsUtils.addEventIdToUserOrganiserEvents(data.getOrganiserId(), newEventDocRef.getId());
        EventsUtils.addEventIdToUserOrganiserPublicUpcomingEvents(data.getOrganiserId(), newEventDocRef.getId());
        return newEventDocRef.getId();
    }

    private static void createEventMetadata(Transaction transaction, String eventId, NewEventData data) {
        logger.info("Creating Event Metadata: {}", eventId);
        Firestore db = FirebaseService.getFirestore();
        EventMetadata eventMetadata = EventsMetadataUtils.extractEventsMetadataFieldsForNewEvent(data);
        DocumentReference eventMetadataDocRef = db.collection(EVENTS_METADATA).document(eventId);

        transaction.set(eventMetadataDocRef, eventMetadata);
    }

}

