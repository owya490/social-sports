package com.functions.fulfilment.repositories;

import com.functions.firebase.services.FirebaseService;
import com.functions.fulfilment.models.FulfilmentSession;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.UUID;

public class FulfilmentSessionRepository {
    private static final Logger logger = LoggerFactory.getLogger(FulfilmentSessionRepository.class);

    public static String createFulfilmentSession(FulfilmentSession fulfilmentSession) throws Exception {
        try {
            String fulfilmentSessionId = UUID.randomUUID().toString();
            DocumentReference sessionDocRef = getFulfilmentSessionDocRef(fulfilmentSessionId);
            sessionDocRef.create(fulfilmentSession).get();
            return sessionDocRef.getId();
        } catch (Exception e) {
            logger.error("Failed to create fulfilment session for eventId: {}", fulfilmentSession.getEventId(), e);
            throw new Exception("Failed to create fulfilment session for eventId: " + fulfilmentSession.getEventId(), e);
        }
    }

    private static DocumentReference getFulfilmentSessionDocRef(String sessionId) {
        Firestore db = FirebaseService.getFirestore();
        return db.collection(FirebaseService.CollectionPaths.FULFILMENT_SESSIONS_ROOT_PATH).document(sessionId);
    }
}
