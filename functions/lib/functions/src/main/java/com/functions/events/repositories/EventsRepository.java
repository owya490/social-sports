package com.functions.events.repositories;

import com.functions.firebase.services.FirebaseService;
import com.functions.events.models.EventData;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

public class EventsRepository {
    private static final Logger logger = LoggerFactory.getLogger(EventsRepository.class);

    /**
     * Retrieves an event by its ID from Firestore and returns it as an {@code Optional<EventData>}.
     *
     * Attempts to locate and map the event document corresponding to the provided event ID across multiple Firestore collection paths.
     * If the event is found and successfully mapped, the event ID is set on the resulting {@code EventData} object and it is returned wrapped in an {@code Optional}.
     * If the event is not found or an error occurs during retrieval or mapping, an empty {@code Optional} is returned.
     *
     * @param eventId the unique identifier of the event to retrieve
     * @return an {@code Optional} containing the {@code EventData} if found and mapped successfully; otherwise, an empty {@code Optional}
     */
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

    /**
     * Searches for a Firestore document matching the given event ID across all configured event collection paths.
     *
     * @param eventId the unique identifier of the event to search for
     * @return the DocumentSnapshot of the found event document
     * @throws Exception if no document is found or if an error occurs during Firestore operations
     */
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
}
