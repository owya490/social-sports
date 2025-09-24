package com.functions.fulfilment.repositories;

import com.functions.firebase.services.FirebaseService;
import com.functions.fulfilment.models.FulfilmentSession;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.Transaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import static com.functions.utils.JavaUtils.objectMapper;

public class FulfilmentSessionRepository {
    private static final Logger logger = LoggerFactory.getLogger(FulfilmentSessionRepository.class);

    public static String createFulfilmentSession(String fulfilmentSessionId,
            FulfilmentSession fulfilmentSession) throws Exception {
        try {
            DocumentReference sessionDocRef = getFulfilmentSessionDocRef(fulfilmentSessionId);
            sessionDocRef.create(fulfilmentSession).get();
            return sessionDocRef.getId();
        } catch (Exception e) {
            logger.error("Failed to create fulfilment session for eventId: {}",
                    fulfilmentSession.getEventData().getEventId(), e);
            throw new Exception("Failed to create fulfilment session for eventId: "
                    + fulfilmentSession.getEventData().getEventId(), e);
        }
    }

    private static DocumentReference getFulfilmentSessionDocRef(String sessionId) {
        Firestore db = FirebaseService.getFirestore();
        return db.collection(FirebaseService.CollectionPaths.FULFILMENT_SESSIONS_ROOT_PATH)
                .document(sessionId);
    }

    public static Optional<FulfilmentSession> getFulfilmentSession(String sessionId,
            Optional<Transaction> transaction) throws Exception {
        try {
            DocumentReference sessionDocRef = getFulfilmentSessionDocRef(sessionId);
            DocumentSnapshot maybeSnapshot;

            if (transaction.isPresent()) {
                // Use transaction
                maybeSnapshot = transaction.get().get(sessionDocRef).get();
            } else {
                // Use regular operation
                maybeSnapshot = sessionDocRef.get().get();
            }

            if (maybeSnapshot.exists()) {
                return Optional.of(FulfilmentSession.fromFirestore(maybeSnapshot));
            }
            return Optional.empty();
        } catch (Exception e) {
            logger.error("Failed to retrieve fulfilment session for sessionId: {}", sessionId, e);
            throw new Exception("Failed to retrieve fulfilment session for sessionId: " + sessionId,
                    e);
        }
    }

    public static void updateFulfilmentSession(String sessionId, FulfilmentSession updatedSession)
            throws Exception {
        try {
            DocumentReference sessionDocRef = getFulfilmentSessionDocRef(sessionId);
            sessionDocRef.set(updatedSession).get();
        } catch (Exception e) {
            logger.error(
                    "Failed to update fulfilment session for sessionId: {}, fulfilmentSession: {}",
                    objectMapper.writeValueAsString(updatedSession), updatedSession, e);
            throw new Exception("Failed to update fulfilment session for sessionId: " + sessionId,
                    e);
        }
    }

    public static void deleteFulfilmentSession(String sessionId, Optional<Transaction> transaction)
            throws Exception {
        try {
            DocumentReference sessionDocRef = getFulfilmentSessionDocRef(sessionId);

            if (transaction.isPresent()) {
                // Use transaction
                transaction.get().delete(sessionDocRef);
            } else {
                // Use regular operation
                sessionDocRef.delete().get();
            }
        } catch (Exception e) {
            logger.error("Failed to delete fulfilment session for sessionId: {}", sessionId, e);
            throw new Exception("Failed to delete fulfilment session for sessionId: " + sessionId,
                    e);
        }
    }

    /**
     * Deletes a fulfilment session (convenience method without transaction)
     */
    public static void deleteFulfilmentSession(String sessionId) throws Exception {
        deleteFulfilmentSession(sessionId, Optional.empty());
    }

    public static List<String> listFulfilmentSessionIdsOlderThan(Timestamp cutoff)
            throws Exception {
        try {
            Firestore db = FirebaseService.getFirestore();
            Query query =
                    db.collection(FirebaseService.CollectionPaths.FULFILMENT_SESSIONS_ROOT_PATH)
                            .whereLessThan("fulfilmentSessionStartTime", cutoff);
            QuerySnapshot snapshots = query.get().get();
            List<String> ids = new ArrayList<>();
            for (QueryDocumentSnapshot doc : snapshots.getDocuments()) {
                ids.add(doc.getId());
            }
            return ids;
        } catch (Exception e) {
            logger.error("Failed to list fulfilment sessions older than cutoff: {}", cutoff, e);
            throw new Exception("Failed to list fulfilment sessions older than cutoff", e);
        }
    }
}
