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
import com.functions.events.utils.TicketTypesUtils;
import com.functions.firebase.services.FirebaseService;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;

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
    public String handle(NewEventData request) {
        if (request == null) {
            throw new IllegalArgumentException("Event data is required");
        }

        try {
            Firestore db = FirebaseService.getFirestore();
            String eventId = db.runTransaction(transaction -> createEvent(request, transaction)).get();

            logger.info("Event created successfully with ID: {}", eventId);
            return "Event created successfully with ID: " + eventId;
        } catch (Exception e) {
            logger.error("Failed to create event", e);
            throw new RuntimeException("Failed to create event: " + e.getMessage(), e);
        }
    }

    /**
     * Create a new event in firebase with a transaction.
     *
     * @param data        data of the new event.
     * @param transaction the firestore transaction object
     */
    // TODO: make createEvent private method and expose only handle method on
    // Service
    public static String createEvent(NewEventData data, Transaction transaction) throws Exception {
        logger.info("Creating event: {}", data.getName());
        Firestore db = FirebaseService.getFirestore();
        String isActive = data.getIsActive() ? ACTIVE : INACTIVE;
        String isPrivate = data.getIsPrivate() ? PRIVATE : PUBLIC;
        DocumentReference newEventDocRef = db.collection(EVENTS).document(isActive).collection(isPrivate).document();
        final String safeName = data.getName() == null ? "" : data.getName();
        final String safeLocation = data.getLocation() == null ? "" : data.getLocation();
        data.setNameTokens(EventsUtils.tokenizeText(safeName));
        data.setLocationTokens(EventsUtils.tokenizeText(safeLocation));
        transaction.set(newEventDocRef, JavaUtils.toMap(data));
        final String eventId = newEventDocRef.getId();
        createEventMetadata(transaction, eventId, data);

        // Create default ticket types for the new event
        TicketTypesUtils.createDefaultTicketTypes(transaction, newEventDocRef, data.getCapacity(), data.getPrice());

        EventsUtils.addEventIdToUserOrganiserEvents(data.getOrganiserId(), eventId);
        // If the event is public, add it to the user's public upcoming events
        if (!data.getIsPrivate()) {
            EventsUtils.addEventIdToUserOrganiserPublicUpcomingEvents(data.getOrganiserId(),
                    newEventDocRef.getId());
        }
        return newEventDocRef.getId();
    }

    private static void createEventMetadata(Transaction transaction, String eventId,
            NewEventData data) {
        logger.info("Creating Event Metadata: {}", eventId);
        Firestore db = FirebaseService.getFirestore();
        EventMetadata eventMetadata = EventsMetadataUtils.extractEventsMetadataFieldsForNewEvent(data);
        DocumentReference eventMetadataDocRef = db.collection(EVENTS_METADATA).document(eventId);

        transaction.set(eventMetadataDocRef, eventMetadata);
    }
}
