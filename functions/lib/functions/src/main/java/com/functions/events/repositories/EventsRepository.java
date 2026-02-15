package com.functions.events.repositories;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventData;
import com.functions.events.models.EventMetadata;
import com.functions.firebase.services.FirebaseService;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
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
        Firestore db = FirebaseService.getFirestore();
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

    /**
     * Get all active public events for a specific organiser.
     *
     * @param organiserId the organiser's user ID
     * @return list of events for the organiser
     */
    public static List<EventData> getActivePublicEventsByOrganiser(String organiserId) {
        if (organiserId == null || organiserId.trim().isEmpty()) {
            throw new IllegalArgumentException("organiserId cannot be null or empty");
        }
        
        logger.info("Querying active public events for organiser: {}", organiserId);
        
        try {
            Firestore db = FirebaseService.getFirestore();
            
            Query query = db.collection(FirebaseService.CollectionPaths.EVENTS)
                    .document(FirebaseService.CollectionPaths.ACTIVE)
                    .collection(FirebaseService.CollectionPaths.PUBLIC)
                    .whereEqualTo("organiserId", organiserId);
            
            QuerySnapshot querySnapshot = query.get().get();
            List<EventData> events = new ArrayList<>();
            
            for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
                EventData eventData = document.toObject(EventData.class);
                if (eventData == null) {
                    logger.warn("Failed to map document to EventData, skipping document with ID: {}", document.getId());
                    continue;
                }
                eventData.setEventId(document.getId());
                events.add(eventData);
            }
            
            logger.info("Found {} active public events for organiser {}", events.size(), organiserId);
            return events;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            logger.error("Interrupted while fetching events for organiser: {}", organiserId, e);
            return Collections.emptyList();
        } catch (ExecutionException e) {
            logger.error("Failed to fetch events for organiser: {}", organiserId, e);
            return Collections.emptyList();
        }
    }
}
