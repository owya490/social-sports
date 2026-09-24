package com.functions.alerts.repositories;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.alerts.clients.ErrorAlertDedupStore;
import com.functions.firebase.services.FirebaseService;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;

public class ErrorAlertDedupRepository implements ErrorAlertDedupStore {
    private static final Logger logger = LoggerFactory.getLogger(ErrorAlertDedupRepository.class);
    public static final Duration DEDUP_WINDOW = Duration.ofMinutes(10);

    @Override
    public boolean tryClaim(String fingerprint) {
        if (fingerprint == null || fingerprint.isBlank()) {
            return true;
        }

        try {
            Firestore db = FirebaseService.getFirestore();
            DocumentReference docRef = db.collection(FirebaseService.CollectionPaths.ERROR_ALERT_DEDUP)
                    .document(fingerprint);
            return db.runTransaction(transaction -> {
                DocumentSnapshot snapshot = transaction.get(docRef).get();
                Timestamp now = Timestamp.now();
                if (snapshot.exists()) {
                    Timestamp lastSentAt = snapshot.getTimestamp("lastSentAt");
                    if (lastSentAt != null
                            && now.toDate().getTime() - lastSentAt.toDate().getTime() < DEDUP_WINDOW.toMillis()) {
                        return false;
                    }
                }
                Map<String, Object> data = new HashMap<>();
                data.put("lastSentAt", now);
                data.put("fingerprint", fingerprint);
                transaction.set(docRef, data);
                return true;
            }).get();
        } catch (Exception e) {
            logger.warn("Error alert dedup failed, allowing send: {}", e.getMessage());
            return true;
        }
    }
}
