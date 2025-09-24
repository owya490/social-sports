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
        logger.debug("Parsing NewEventData from UnifiedRequest");
        try {
            NewEventData parsed = JavaUtils.objectMapper.treeToValue(data.data(), NewEventData.class);
            logger.info("Successfully parsed NewEventData: name={}, organiser={}, isActive={}, isPrivate={}",
                    parsed.getName(), parsed.getOrganiserId(), parsed.getIsActive(), parsed.getIsPrivate());
            return parsed;
        } catch (JsonProcessingException e) {
            logger.error("Failed to parse NewEventData: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to parse NewEventData", e);
        }
    }

    @Override
    public String handle(NewEventData request) {
        logger.info("Handling CreateEventRequest");

        if (request == null) {
            logger.error("Event data is null");
            throw new IllegalArgumentException("Event data is required");
        }

        logger.info("Creating event: name={}, organiser={}, location={}, isActive={}, isPrivate={}",
                request.getName(), request.getOrganiserId(), request.getLocation(),
                request.getIsActive(), request.getIsPrivate());

        try {
            logger.debug("Starting Firestore transaction for event creation");
            Firestore db = FirebaseService.getFirestore();
            String eventId = db.runTransaction(transaction -> {
                logger.debug("Executing event creation transaction");
                return createEvent(request, transaction);
            }).get();

            logger.info("Event created successfully with ID: {}", eventId);
            return "Event created successfully with ID: " + eventId;
        } catch (Exception e) {
            logger.error("Failed to create event: name={}, organiser={}, error={}",
                    request.getName(), request.getOrganiserId(), e.getMessage(), e);
            throw new RuntimeException("Failed to create event: " + e.getMessage(), e);
        }
    }

    /**
     * Create a new event in firebase with a transaction.
     *
     * @param data        data of the new event.
     * @param transaction the firestore transaction object
     */
    // TODO: make createEvent private method and expose only handle method on Service
    public static String createEvent(NewEventData data, Transaction transaction) throws Exception {
        logger.info("Creating event in transaction: name={}, organiser={}", data.getName(), data.getOrganiserId());

        Firestore db = FirebaseService.getFirestore();
        String isActive = data.getIsActive() ? ACTIVE : INACTIVE;
        String isPrivate = data.getIsPrivate() ? PRIVATE : PUBLIC;

        logger.debug("Event collection path: {}/{}/{}", EVENTS, isActive, isPrivate);

        DocumentReference newEventDocRef =
                db.collection(EVENTS).document(isActive).collection(isPrivate).document();

        final String safeName = data.getName() == null ? "" : data.getName();
        final String safeLocation = data.getLocation() == null ? "" : data.getLocation();

        logger.debug("Tokenizing event name and location for search");
        data.setNameTokens(EventsUtils.tokenizeText(safeName));
        data.setLocationTokens(EventsUtils.tokenizeText(safeLocation));

        logger.debug("Setting event document in transaction");
        transaction.set(newEventDocRef, JavaUtils.toMap(data));

        final String eventId = newEventDocRef.getId();
        logger.info("Generated event ID: {}", eventId);

        logger.debug("Creating event metadata");
        createEventMetadata(transaction, eventId, data);

        logger.debug("Adding event to organiser's events");
        EventsUtils.addEventIdToUserOrganiserEvents(data.getOrganiserId(), eventId);

        // If the event is public, add it to the user's public upcoming events
        if (!data.getIsPrivate()) {
            logger.debug("Adding public event to organiser's upcoming events");
            EventsUtils.addEventIdToUserOrganiserPublicUpcomingEvents(data.getOrganiserId(), eventId);
        } else {
            logger.debug("Event is private, skipping public upcoming events update");
        }

        logger.info("Event creation completed successfully: eventId={}", eventId);
        return eventId;
    }

    private static void createEventMetadata(Transaction transaction, String eventId, NewEventData data) {
        logger.info("Creating Event Metadata for eventId: {}", eventId);

        Firestore db = FirebaseService.getFirestore();

        logger.debug("Extracting metadata fields from event data");
        EventMetadata eventMetadata = EventsMetadataUtils.extractEventsMetadataFieldsForNewEvent(data);

        DocumentReference eventMetadataDocRef = db.collection(EVENTS_METADATA).document(eventId);
        logger.debug("Setting event metadata document in transaction");

        transaction.set(eventMetadataDocRef, eventMetadata);
        logger.info("Event metadata creation completed for eventId: {}", eventId);
    }
}
