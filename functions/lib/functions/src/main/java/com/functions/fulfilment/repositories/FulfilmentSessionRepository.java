package com.functions.fulfilment.repositories;

import static com.functions.utils.JavaUtils.objectMapper;

import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.firebase.services.FirebaseService;
import com.functions.fulfilment.models.FulfilmentSession;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;

public class FulfilmentSessionRepository {
    private static final Logger logger = LoggerFactory.getLogger(FulfilmentSessionRepository.class);

    /**
     * Creates a new fulfilment session in Firestore with a generated unique session ID.
     *
     * @param fulfilmentSession the fulfilment session data to store
     * @return the generated session ID of the newly created fulfilment session
     * @throws Exception if the session could not be created in Firestore
     */
    public static String createFulfilmentSession(FulfilmentSession fulfilmentSession) throws Exception {
        String fulfilmentSessionId = UUID.randomUUID().toString();
        return createFulfilmentSession(fulfilmentSessionId, fulfilmentSession);
    }

    /**
     * Creates a new fulfilment session document in Firestore with the specified session ID and session data.
     *
     * @param fulfilmentSessionId the unique identifier for the fulfilment session document
     * @param fulfilmentSession the fulfilment session data to store
     * @return the Firestore document ID of the created fulfilment session
     * @throws Exception if the session creation fails
     */
    public static String createFulfilmentSession(String fulfilmentSessionId, FulfilmentSession fulfilmentSession) throws Exception {
        try {
            DocumentReference sessionDocRef = getFulfilmentSessionDocRef(fulfilmentSessionId);
            sessionDocRef.create(fulfilmentSession).get();
            return sessionDocRef.getId();
        } catch (Exception e) {
            logger.error("Failed to create fulfilment session for eventId: {}", fulfilmentSession.getEventData().getEventId(), e);
            throw new Exception("Failed to create fulfilment session for eventId: " + fulfilmentSession.getEventData().getEventId(), e);
        }
    }

    /**
     * Returns a Firestore DocumentReference for the fulfilment session document with the specified session ID.
     *
     * @param sessionId the unique identifier of the fulfilment session
     * @return the DocumentReference pointing to the fulfilment session document in Firestore
     */
    private static DocumentReference getFulfilmentSessionDocRef(String sessionId) {
        Firestore db = FirebaseService.getFirestore();
        return db.collection(FirebaseService.CollectionPaths.FULFILMENT_SESSIONS_ROOT_PATH).document(sessionId);
    }

    /**
     * Retrieves a fulfilment session by its session ID from Firestore.
     *
     * @param sessionId the unique identifier of the fulfilment session to retrieve
     * @return an {@code Optional} containing the {@code FulfilmentSession} if found, or {@code Optional.empty()} if not found
     * @throws Exception if an error occurs while accessing Firestore
     */
    public static Optional<FulfilmentSession> getFulfilmentSession(String sessionId) throws Exception {
        try {
            DocumentReference sessionDocRef = getFulfilmentSessionDocRef(sessionId);
            DocumentSnapshot maybeSnapshot = sessionDocRef.get().get();
            if (maybeSnapshot.exists()) {
                return Optional.of(FulfilmentSession.fromFirestore(maybeSnapshot));
            }
            return Optional.empty();
        } catch (Exception e) {
            logger.error("Failed to retrieve fulfilment session for sessionId: {}", sessionId, e);
            throw new Exception("Failed to retrieve fulfilment session for sessionId: " + sessionId, e);
        }
    }

    /**
     * Updates the fulfilment session document in Firestore with the specified session ID using the provided session data.
     *
     * @param sessionId the unique identifier of the fulfilment session to update
     * @param updatedSession the new data to replace the existing fulfilment session
     * @throws Exception if the update operation fails
     */
    public static void updateFulfilmentSession(String sessionId, FulfilmentSession updatedSession) throws Exception {
        try {
            DocumentReference sessionDocRef = getFulfilmentSessionDocRef(sessionId);
            sessionDocRef.set(updatedSession).get();
        } catch (Exception e) {
            logger.error("Failed to update fulfilment session for sessionId: {}, fulfilmentSession: {}", objectMapper.writeValueAsString(updatedSession), updatedSession, e);
            throw new Exception("Failed to update fulfilment session for sessionId: " + sessionId, e);
        }
    }

    /**
     * Deletes the fulfilment session document identified by the given session ID from Firestore.
     *
     * @param sessionId the unique identifier of the fulfilment session to delete
     * @throws Exception if the deletion fails or an error occurs during the Firestore operation
     */
    public static void deleteFulfilmentSession(String sessionId) throws Exception {
        try {
            DocumentReference sessionDocRef = getFulfilmentSessionDocRef(sessionId);
            sessionDocRef.delete().get();
        } catch (Exception e) {
            logger.error("Failed to delete fulfilment session for sessionId: {}", sessionId, e);
            throw new Exception("Failed to delete fulfilment session for sessionId: " + sessionId, e);
        }
    }
}
