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
import com.google.cloud.firestore.Transaction;

public class EventsRepository {
    private static final Logger logger = LoggerFactory.getLogger(EventsRepository.class);

    public static Optional<EventData> getEventById(String eventId) {
        return getEventById(eventId, Optional.empty());
    }

    public static Optional<EventData> getEventById(String eventId, Optional<Transaction> transaction) {
        try {
            EventData eventData = findEventDocumentSnapshot(eventId, transaction).toObject(EventData.class);
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

    private static DocumentSnapshot findEventDocumentSnapshot(String eventId, Optional<Transaction> transaction) throws Exception {
        Firestore db = FirebaseService.getFirestore();
        try {
            for (String path : FirebaseService.CollectionPaths.EVENT_PATHS) {
                DocumentReference docRef = db.document(path + "/" + eventId);
                DocumentSnapshot maybeDocSnapshot = transaction.isPresent() ? transaction.get().get(docRef).get() : docRef.get().get();
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
        return getEventMetadataById(eventId, Optional.empty());
    }

    public static Optional<EventMetadata> getEventMetadataById(String eventId, Optional<Transaction> transaction) {
        Firestore db = FirebaseService.getFirestore();
        try {
            DocumentReference docRef = db.document(FirebaseService.CollectionPaths.EVENTS_METADATA + "/" + eventId);
            DocumentSnapshot maybeDocSnapshot = transaction.isPresent() ? transaction.get().get(docRef).get() : docRef.get().get();
            if (maybeDocSnapshot.exists()) {
                return Optional.of(maybeDocSnapshot.toObject(EventMetadata.class));
            }
            return Optional.empty();
        } catch (Exception e) {
            logger.error("Error retrieving event metadata by ID: {}", eventId, e);
            return Optional.empty();
        }
    }

    /**
     * Updates a field in the event document by ID.
     * Finds the event across all possible paths and updates it within a transaction.
     *
     * @param eventId The event ID
     * @param field The field name to update
     * @param value The new value
     * @param transaction The Firestore transaction (required)
     * @throws Exception If the event is not found
     */
    public static void updateEventById(String eventId, String field, Object value, Transaction transaction) throws Exception {
        DocumentReference docRef = findEventDocumentReference(eventId, transaction);
        transaction.update(docRef, field, value);
    }

    /**
     * Updates the event metadata document by ID within a transaction.
     *
     * @param eventId The event ID
     * @param eventMetadata The updated event metadata object
     * @param transaction The Firestore transaction (required)
     * @throws Exception If the metadata document is not found
     */
    public static void updateEventMetadataById(String eventId, EventMetadata eventMetadata, Transaction transaction) throws Exception {
        Firestore db = FirebaseService.getFirestore();
        DocumentReference docRef = db.document(FirebaseService.CollectionPaths.EVENTS_METADATA + "/" + eventId);
        // Read first to ensure it exists (Firestore requires all reads before writes)
        DocumentSnapshot snapshot = transaction.get(docRef).get();
        if (!snapshot.exists()) {
            throw new Exception("Event metadata not found for eventId: " + eventId);
        }
        transaction.set(docRef, eventMetadata);
    }

    private static DocumentReference findEventDocumentReference(String eventId, Transaction transaction) throws Exception {
        Firestore db = FirebaseService.getFirestore();
        for (String path : FirebaseService.CollectionPaths.EVENT_PATHS) {
            DocumentReference docRef = db.document(path + "/" + eventId);
            DocumentSnapshot snapshot = transaction.get(docRef).get();
            if (snapshot.exists()) {
                return docRef;
            }
        }
        throw new Exception("No event document found for eventId: " + eventId);
    }
}
