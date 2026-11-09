package com.functions.alerts.repositories;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import com.functions.alerts.clients.AlertClaimStore;
import com.functions.firebase.services.FirebaseService.CollectionPaths;
import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.SetOptions;
import com.google.cloud.firestore.Transaction;

/**
 * Windows mirror the Monitoring policy: it sends at most one notification per
 * 600s and opens at most 20 log-based incidents a day, dropping the rest
 * silently. Claiming within those limits keeps every published summary a page.
 */
public class AlertClaimRepository implements AlertClaimStore {
    public static final Duration FINGERPRINT_WINDOW = Duration.ofHours(6);
    public static final Duration GLOBAL_WINDOW = Duration.ofMinutes(10);
    /** Below Google's 20 so its randomly timed daily reset cannot drop the last pages. */
    public static final long DAILY_LIMIT = 15;
    static final String COLLECTION = CollectionPaths.ERROR_ALERT_CLAIMS;
    /** Firestore TTL deletes expired claims; deletion can lag, so reads still compare against now. */
    static final String EXPIRE_AT = "expireAt";
    static final String COUNT = "count";

    private final Firestore db;
    private final Clock clock;

    public AlertClaimRepository(Firestore db) {
        this(db, Clock.systemUTC());
    }

    AlertClaimRepository(Firestore db, Clock clock) {
        this.db = db;
        this.clock = clock;
    }

    @Override
    public boolean claim(String fingerprint) {
        Instant now = clock.instant();
        DocumentReference fingerprintDoc = fingerprintDoc(fingerprint);
        DocumentReference globalDoc = globalDoc();
        DocumentReference dayDoc = dayDoc(now);
        return run(transaction -> {
            DocumentSnapshot fingerprintState = transaction.get(fingerprintDoc).get();
            DocumentSnapshot globalState = transaction.get(globalDoc).get();
            DocumentSnapshot dayState = transaction.get(dayDoc).get();
            Long sent = dayState.exists() ? dayState.getLong(COUNT) : null;
            if (active(fingerprintState, now) || active(globalState, now)
                    || (sent != null && sent >= DAILY_LIMIT)) {
                return false;
            }
            transaction.set(fingerprintDoc, expiring(now, FINGERPRINT_WINDOW));
            transaction.set(globalDoc, expiring(now, GLOBAL_WINDOW));
            transaction.set(dayDoc, Map.of(COUNT, (sent == null ? 0 : sent) + 1,
                    EXPIRE_AT, timestamp(now.plus(Duration.ofDays(2)))));
            return true;
        });
    }

    @Override
    public void release(String fingerprint) {
        Instant now = clock.instant();
        DocumentReference fingerprintDoc = fingerprintDoc(fingerprint);
        DocumentReference globalDoc = globalDoc();
        DocumentReference dayDoc = dayDoc(now);
        run(transaction -> {
            transaction.delete(fingerprintDoc);
            transaction.delete(globalDoc);
            transaction.set(dayDoc, Map.of(COUNT, FieldValue.increment(-1)), SetOptions.merge());
            return null;
        });
    }

    private DocumentReference fingerprintDoc(String fingerprint) {
        return db.collection(COLLECTION).document("fingerprint-" + fingerprint);
    }

    private DocumentReference globalDoc() {
        return db.collection(COLLECTION).document("global");
    }

    private DocumentReference dayDoc(Instant now) {
        return db.collection(COLLECTION).document("day-" + now.atZone(ZoneOffset.UTC).toLocalDate());
    }

    private static boolean active(DocumentSnapshot state, Instant now) {
        Timestamp expireAt = state.exists() ? state.getTimestamp(EXPIRE_AT) : null;
        return expireAt != null && expireAt.toDate().toInstant().isAfter(now);
    }

    private static Map<String, Object> expiring(Instant now, Duration window) {
        return Map.of("claimedAt", timestamp(now), EXPIRE_AT, timestamp(now.plus(window)));
    }

    private <T> T run(Transaction.Function<T> callback) {
        ApiFuture<T> operation = db.runTransaction(callback);
        try {
            return operation.get(20, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            operation.cancel(true);
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted during error alert claim", e);
        } catch (Exception e) {
            operation.cancel(true);
            throw new IllegalStateException("Error alert claim failed", e);
        }
    }

    private static Timestamp timestamp(Instant instant) {
        return Timestamp.ofTimeSecondsAndNanos(instant.getEpochSecond(), instant.getNano());
    }
}
