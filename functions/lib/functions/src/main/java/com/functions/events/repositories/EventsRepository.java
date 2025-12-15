package com.functions.events.repositories;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventData;
import com.functions.events.models.EventMetadata;
import com.functions.firebase.services.FirebaseService;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;

public class EventsRepository {
    private static final Logger logger = LoggerFactory.getLogger(EventsRepository.class);

    public static Optional<EventData> getEventById(String eventId) {
        try {
            EventData eventData = findEventDocumentSnapshot(eventId).toObject(EventData.class);
            if (eventData == null) {
                logger.error("Failed to map returned event document snapshot to EventData type: {}", eventId);
                throw new Exception("Failed to map returned event document snapshot to EventData type: " + eventId);
            }
            eventData.setEventId(eventId);

            return Optional.of(eventData);
        } catch (Exception e) {
            logger.error("Error retrieving event by ID: {}", eventId, e);
            return Optional.empty();
        }
    }

    private static DocumentSnapshot findEventDocumentSnapshot(String eventId) throws Exception {
        Firestore db = FirebaseService.getFirestore();
        try {
            for (String path : FirebaseService.CollectionPaths.EVENT_PATHS) {
                DocumentReference docRef = db.document(path + "/" + eventId);
                DocumentSnapshot maybeDocSnapshot = docRef.get().get();
                if (maybeDocSnapshot.exists()) {
                    return maybeDocSnapshot;
                }
            }

            // If no document is found, log and throw an exception
            logger.error("No event document found for eventId in any subcollection: {}", eventId);
            throw new Exception("No event document found for eventId: " + eventId);
        } catch (Exception e) {
            logger.error("Error finding event document reference for ID: {}", eventId, e);
            throw new Exception("Could not find event document reference for ID: " + eventId, e);
        }
    }

    public static Optional<EventMetadata> getEventMetadataById(String eventId) {
        try {
            DocumentReference docRef = db.document(FirebaseService.CollectionPaths.EVENTS_METADATA + "/" + eventId);
            DocumentSnapshot maybeDocSnapshot = docRef.get().get();
            if (maybeDocSnapshot.exists()) {
                return Optional.of(maybeDocSnapshot.toObject(EventMetadata.class));
            }
            return Optional.empty();
        } catch (Exception e) {
            logger.error("Error retrieving event metadata by ID: {}", eventId, e);
            return Optional.empty();
        }
    }
}
