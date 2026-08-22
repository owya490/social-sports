package com.functions.events.handlers;

import static com.functions.firebase.services.FirebaseService.CollectionPaths.ACTIVE;
import static com.functions.firebase.services.FirebaseService.CollectionPaths.EVENTS;
import static com.functions.firebase.services.FirebaseService.CollectionPaths.EVENTS_METADATA;
import static com.functions.firebase.services.FirebaseService.CollectionPaths.INACTIVE;
import static com.functions.firebase.services.FirebaseService.CollectionPaths.PRIVATE;
import static com.functions.firebase.services.FirebaseService.CollectionPaths.PUBLIC;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.events.models.EventMetadata;
import com.functions.events.models.NewEventData;
import com.functions.events.utils.EventsMetadataUtils;
import com.functions.events.utils.EventsUtils;
import com.functions.firebase.services.FirebaseService;
import com.functions.global.models.AuthContext;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.global.services.EventAuthorizationService;
import com.functions.utils.JavaUtils;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;

import java.util.UUID;

public class CreateEventHandler implements Handler<NewEventData, String> {
    private static final Logger logger = LoggerFactory.getLogger(CreateEventHandler.class);

    @Override
    public NewEventData parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), NewEventData.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse NewEventData", e);
        }
    }

    @Override
    public String handle(NewEventData request, AuthContext authContext) {
        if (request == null) {
            throw new IllegalArgumentException("Event data is required");
        }
        if (request.getOrganiserId() == null || request.getOrganiserId().isBlank()) {
            throw new IllegalArgumentException("organiserId is required");
        }

        EventAuthorizationService.requireMatchingUser(authContext.requireUid(), request.getOrganiserId(),
                "You are not allowed to create events for another organiser");

        try {
            Firestore db = FirebaseService.getFirestore();
            String eventId = UUID.randomUUID().toString();
            db.runTransaction(transaction ->
                    createEvent(request, transaction, eventId)).get();

            logger.info("Event created successfully with ID: {}", eventId);
            return "Event created successfully with ID: " + eventId;
        } catch (Exception e) {
            logger.error("Failed to create event", e);
            throw new RuntimeException("Failed to create event: " + e.getMessage(), e);
        }
    }

    /**
     * Creates a new event and its organiser indexes in a Firestore transaction.
     *
     * @param data data of the new event
     * @param transaction the Firestore transaction
     * @param eventId a retry-stable event ID allocated before the transaction begins
     */
    public static String createEvent(NewEventData data, Transaction transaction, String eventId)
            throws Exception {
        logger.info("Creating event: {}", data.getName());
        Firestore db = FirebaseService.getFirestore();
        String isActive = data.getIsActive() ? ACTIVE : INACTIVE;
        String isPrivate = data.getIsPrivate() ? PRIVATE : PUBLIC;
        DocumentReference newEventDocRef =
                db.collection(EVENTS).document(isActive).collection(isPrivate).document(eventId);
        final String safeName = data.getName() == null ? "" : data.getName();
        final String safeLocation = data.getLocation() == null ? "" : data.getLocation();
        data.setNameTokens(EventsUtils.tokenizeText(safeName));
        data.setLocationTokens(EventsUtils.tokenizeText(safeLocation));
        transaction.set(newEventDocRef, data);
        createEventMetadata(transaction, eventId, data);
        EventsUtils.addEventIdToUserOrganiserEvents(transaction, data.getOrganiserId(), eventId);
        // If the event is public, add it to the user's public upcoming events
        if (!data.getIsPrivate()) {
            EventsUtils.addEventIdToUserOrganiserPublicUpcomingEvents(transaction,
                    data.getOrganiserId(), eventId);
        }
        return eventId;
    }

    public static String createEvent(NewEventData data, Transaction transaction) throws Exception {
        return createEvent(data, transaction, UUID.randomUUID().toString());
    }

    private static void createEventMetadata(Transaction transaction, String eventId,
                                            NewEventData data) {
        logger.info("Creating Event Metadata: {}", eventId);
        Firestore db = FirebaseService.getFirestore();
        EventMetadata eventMetadata =
                EventsMetadataUtils.extractEventsMetadataFieldsForNewEvent(data);
        DocumentReference eventMetadataDocRef = db.collection(EVENTS_METADATA).document(eventId);

        transaction.set(eventMetadataDocRef, eventMetadata);
    }
}
