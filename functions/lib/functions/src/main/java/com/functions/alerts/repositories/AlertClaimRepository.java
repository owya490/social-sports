package com.functions.alerts.repositories;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import com.functions.alerts.clients.AlertClaimStore;
import com.functions.firebase.services.FirebaseService.CollectionPaths;
import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;

/**
 * Windows mirror the Monitoring policy: it sends at most one notification per
 * 600s and opens at most 20 log-based incidents a day, dropping the rest
 * silently. Claiming within those limits keeps every published summary a page.
 */
public class AlertClaimRepository implements AlertClaimStore {
    public static final Duration FINGERPRINT_WINDOW = Duration.ofHours(6);
    /**
     * Monitoring counts its 600s from publication, but the window starts at claim;
     * the extra two minutes cover the 120s function timeout between them.
     */
    public static final Duration GLOBAL_WINDOW = Duration.ofMinutes(12);
    /**
     * Rolling, and below Google's 20, because Monitoring's daily incident limit
     * resets at a random time that a calendar-day counter could straddle.
     */
    public static final int DAILY_LIMIT = 15;
    static final Duration BUDGET_WINDOW = Duration.ofDays(1);
    static final String COLLECTION = CollectionPaths.ERROR_ALERT_CLAIMS;
    /** Firestore TTL deletes expired claims; deletion can lag, so reads still compare against now. */
    static final String EXPIRE_AT = "expireAt";
    static final String SENT_AT = "sentAt";

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
    public Optional<Claim> claim(String fingerprint) {
        // Firestore stores microseconds; release must find the exact stored send time.
        Instant now = clock.instant().truncatedTo(ChronoUnit.MICROS);
        DocumentReference fingerprintDoc = fingerprintDoc(fingerprint);
        DocumentReference globalDoc = globalDoc();
        DocumentReference budgetDoc = budgetDoc();
        return run(transaction -> {
            DocumentSnapshot fingerprintState = transaction.get(fingerprintDoc).get();
            DocumentSnapshot globalState = transaction.get(globalDoc).get();
            List<Timestamp> sent = recentSends(transaction.get(budgetDoc).get(), now);
            if (active(fingerprintState, now) || active(globalState, now) || sent.size() >= DAILY_LIMIT) {
                return Optional.<Claim>empty();
            }
            sent.add(timestamp(now));
            transaction.set(fingerprintDoc, expiring(now, FINGERPRINT_WINDOW));
            transaction.set(globalDoc, expiring(now, GLOBAL_WINDOW));
            transaction.set(budgetDoc, Map.of(SENT_AT, sent));
            return Optional.of(new Claim(fingerprint, now));
        });
    }

    @Override
    public void release(Claim claim) {
        DocumentReference fingerprintDoc = fingerprintDoc(claim.fingerprint());
        DocumentReference globalDoc = globalDoc();
        DocumentReference budgetDoc = budgetDoc();
        Timestamp claimedAt = timestamp(claim.claimedAt());
        run(transaction -> {
            List<Timestamp> sent = recentSends(transaction.get(budgetDoc).get(), clock.instant());
            sent.remove(claimedAt);
            transaction.delete(fingerprintDoc);
            transaction.delete(globalDoc);
            transaction.set(budgetDoc, Map.of(SENT_AT, sent));
            return null;
        });
    }

    private DocumentReference fingerprintDoc(String fingerprint) {
        return db.collection(COLLECTION).document("fingerprint-" + fingerprint);
    }

    private DocumentReference globalDoc() {
        return db.collection(COLLECTION).document("global");
    }

    private DocumentReference budgetDoc() {
        return db.collection(COLLECTION).document("budget");
    }

    private static List<Timestamp> recentSends(DocumentSnapshot state, Instant now) {
        List<Timestamp> sends = new ArrayList<>();
        Object values = state.exists() ? state.get(SENT_AT) : null;
        if (values instanceof List<?> list) {
            for (Object value : list) {
                if (value instanceof Timestamp time && time.toDate().toInstant().isAfter(now.minus(BUDGET_WINDOW))) {
                    sends.add(time);
                }
            }
        }
        return sends;
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
