package com.functions.fulfilment.repositories;

import static com.functions.utils.JavaUtils.objectMapper;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.firebase.services.FirebaseService;
import com.functions.fulfilment.models.FulfilmentSession;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;

public class FulfilmentSessionRepository {
    private static final Logger logger = LoggerFactory.getLogger(FulfilmentSessionRepository.class);

    public static String createFulfilmentSession(String fulfilmentSessionId, FulfilmentSession fulfilmentSession)
            throws Exception {
        try {
            DocumentReference sessionDocRef = getFulfilmentSessionDocRef(fulfilmentSessionId);
            sessionDocRef.create(fulfilmentSession).get();
            return sessionDocRef.getId();
        } catch (Exception e) {
            logger.error("Failed to create fulfilment session for eventId: {}",
                    fulfilmentSession.getEventData().getEventId(), e);
            throw new Exception(
                    "Failed to create fulfilment session for eventId: " + fulfilmentSession.getEventData().getEventId(),
                    e);
        }
    }

    private static DocumentReference getFulfilmentSessionDocRef(String sessionId) {
        Firestore db = FirebaseService.getFirestore();
        return db.collection(FirebaseService.CollectionPaths.FULFILMENT_SESSIONS_ROOT_PATH).document(sessionId);
    }

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

    public static void updateFulfilmentSession(String sessionId, FulfilmentSession updatedSession) throws Exception {
        try {
            DocumentReference sessionDocRef = getFulfilmentSessionDocRef(sessionId);
            sessionDocRef.set(updatedSession).get();
        } catch (Exception e) {
            logger.error("Failed to update fulfilment session for sessionId: {}, fulfilmentSession: {}",
                    objectMapper.writeValueAsString(updatedSession), updatedSession, e);
            throw new Exception("Failed to update fulfilment session for sessionId: " + sessionId, e);
        }
    }

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
