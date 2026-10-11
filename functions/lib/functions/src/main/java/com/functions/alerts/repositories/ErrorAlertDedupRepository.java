package com.functions.alerts.repositories;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import com.functions.alerts.clients.ErrorAlertDedupStore;
import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.SetOptions;
import com.google.cloud.firestore.Transaction;

public class ErrorAlertDedupRepository implements ErrorAlertDedupStore {
    public static final Duration DEDUP_WINDOW = Duration.ofMinutes(10);
    public static final Duration IN_FLIGHT_WINDOW = Duration.ofMinutes(3);
    static final int DAILY_LIMIT = 20;
    static final String COLLECTION = "ErrorAlertDedup";
    static final String GLOBAL_SEND_DOCUMENT = "_global";

    private final Firestore db;
    private final DocumentReference global;
    private final Clock clock;

    public ErrorAlertDedupRepository(Firestore db) {
        this(db, Clock.systemUTC());
    }

    ErrorAlertDedupRepository(Firestore db, Clock clock) {
        this.db = db;
        this.global = db.collection(COLLECTION).document(GLOBAL_SEND_DOCUMENT);
        this.clock = clock;
    }

    @Override
    public Optional<Reservation> reserve() {
        Reservation reservation = new Reservation(UUID.randomUUID().toString());
        Instant now = clock.instant();
        return run(transaction -> {
            DocumentSnapshot globalState = transaction.get(global).get();
            if (recent(globalState, "lastSentAt", now, DEDUP_WINDOW)
                    || recentSends(globalState, now).size() >= DAILY_LIMIT) {
                return Optional.empty();
            }
            if (recent(globalState, "inFlightAt", now, IN_FLIGHT_WINDOW)) {
                throw new IllegalStateException("Another error alert delivery is in progress");
            }
            Map<String, Object> lease = Map.of("owner", reservation.owner(), "inFlightAt", timestamp(now));
            transaction.set(global, lease, SetOptions.merge());
            return Optional.of(reservation);
        });
    }

    @Override
    public void complete(Reservation reservation) {
        Instant now = clock.instant();
        run(transaction -> {
            DocumentSnapshot globalState = transaction.get(global).get();
            if (!owned(globalState, reservation)) {
                throw new IllegalStateException("Error alert reservation is no longer owned");
            }
            List<Timestamp> sends = recentSends(globalState, now);
            sends.add(timestamp(now));
            Map<String, Object> completed = Map.of(
                    "lastSentAt", timestamp(now), "owner", FieldValue.delete(), "inFlightAt", FieldValue.delete(),
                    "recentSends", sends);
            transaction.update(global, completed);
            return null;
        });
    }

    @Override
    public void release(Reservation reservation) {
        run(transaction -> {
            DocumentSnapshot globalState = transaction.get(global).get();
            Map<String, Object> cleared = Map.of("owner", FieldValue.delete(), "inFlightAt", FieldValue.delete());
            if (owned(globalState, reservation)) {
                transaction.update(global, cleared);
            }
            return null;
        });
    }

    private <T> T run(Transaction.Function<T> callback) {
        ApiFuture<T> operation = db.runTransaction(callback);
        try {
            return operation.get(20, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            operation.cancel(true);
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted during error alert reservation", e);
        } catch (Exception e) {
            operation.cancel(true);
            throw new IllegalStateException("Error alert reservation failed", e);
        }
    }

    private static boolean owned(DocumentSnapshot state, Reservation reservation) {
        return state.exists() && reservation.owner().equals(state.getString("owner"));
    }

    private static boolean recent(DocumentSnapshot state, String field, Instant now, Duration window) {
        Timestamp value = state.exists() ? state.getTimestamp(field) : null;
        return value != null && value.toDate().toInstant().isAfter(now.minus(window));
    }

    private static List<Timestamp> recentSends(DocumentSnapshot state, Instant now) {
        List<Timestamp> sends = new ArrayList<>();
        Object values = state.exists() ? state.get("recentSends") : null;
        if (values instanceof List<?> list) {
            for (Object value : list) {
                if (value instanceof Timestamp time && time.toDate().toInstant().isAfter(now.minus(Duration.ofDays(1)))) {
                    sends.add(time);
                }
            }
        }
        return sends;
    }

    private static Timestamp timestamp(Instant instant) {
        return Timestamp.ofTimeSecondsAndNanos(instant.getEpochSecond(), instant.getNano());
    }
}
