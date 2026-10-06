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
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;

public class ErrorAlertDedupRepository implements ErrorAlertDedupStore {
    private static final Logger logger = LoggerFactory.getLogger(ErrorAlertDedupRepository.class);
    public static final Duration DEDUP_WINDOW = Duration.ofMinutes(10);
    public static final Duration IN_FLIGHT_WINDOW = Duration.ofMinutes(2);
    public static final String GLOBAL_SEND_DOCUMENT = "_global";

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
                    if (withinWindow(lastSentAt, now, DEDUP_WINDOW)) {
                        return false;
                    }
                    Timestamp inFlightAt = snapshot.getTimestamp("inFlightAt");
                    if (withinWindow(inFlightAt, now, IN_FLIGHT_WINDOW)) {
                        return false;
                    }
                }
                Map<String, Object> data = new HashMap<>();
                data.put("inFlightAt", now);
                data.put("fingerprint", fingerprint);
                if (snapshot.exists() && snapshot.get("lastSentAt") != null) {
                    data.put("lastSentAt", snapshot.get("lastSentAt"));
                }
                transaction.set(docRef, data);
                return true;
            }).get();
        } catch (Exception e) {
            logger.warn("Error alert dedup failed, allowing send: {}", e.getMessage());
            return true;
        }
    }

    @Override
    public boolean tryClaimGlobal() {
        return tryClaim(GLOBAL_SEND_DOCUMENT);
    }

    @Override
    public void markSent(String fingerprint) {
        if (fingerprint == null || fingerprint.isBlank()) {
            return;
        }
        try {
            Firestore db = FirebaseService.getFirestore();
            DocumentReference docRef = db.collection(FirebaseService.CollectionPaths.ERROR_ALERT_DEDUP)
                    .document(fingerprint);
            db.runTransaction(transaction -> {
                DocumentSnapshot snapshot = transaction.get(docRef).get();
                Map<String, Object> data = new HashMap<>();
                data.put("lastSentAt", Timestamp.now());
                data.put("fingerprint", fingerprint);
                data.put("inFlightAt", FieldValue.delete());
                if (snapshot.exists()) {
                    transaction.update(docRef, data);
                } else {
                    transaction.set(docRef, data);
                }
                return null;
            }).get();
        } catch (Exception e) {
            logger.warn("Error alert dedup markSent failed: {}", e.getMessage());
        }
    }

    @Override
    public void markSentGlobal() {
        markSent(GLOBAL_SEND_DOCUMENT);
    }

    private static boolean withinWindow(Timestamp timestamp, Timestamp now, Duration window) {
        return timestamp != null
                && now.toDate().getTime() - timestamp.toDate().getTime() < window.toMillis();
    }
}
