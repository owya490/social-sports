package com.functions.alerts.repositories;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
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
    /**
     * Holds a same-error lease and a daily-budget slot. The function timeout is
     * 2 minutes, so a live send finishes inside this window. A longer call would
     * free the slot while that send was still running.
     */
    public static final Duration IN_FLIGHT_WINDOW = Duration.ofMinutes(3);
    /** Matches Cloud Monitoring autoClose (604800s) so EXTRACT(sms) stays stable for one incident. */
    public static final Duration SMS_INCIDENT_WINDOW = Duration.ofDays(7);
    /**
     * Stops a burst of distinct fingerprints from using the whole daily budget.
     * A public route can log caller-controlled text at ERROR, and that text is
     * part of the fingerprint.
     */
    public static final Duration DEDUP_WINDOW = Duration.ofMinutes(10);
    public static final int BURST_LIMIT = 3;
    public static final int INCIDENT_LIMIT = 3;
    static final int DAILY_LIMIT = 20;
    static final String COLLECTION = "ErrorAlertDedup";
    static final String GLOBAL_SEND_DOCUMENT = "_global";
    static final String PENDING_RESERVATIONS = "pendingReservations";

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
    public Optional<Reservation> reserve(String fingerprint) {
        String key = key(fingerprint);
        Reservation reservation = new Reservation(UUID.randomUUID().toString(), key);
        Instant now = clock.instant();
        return run(transaction -> {
            DocumentSnapshot globalState = transaction.get(global).get();
            DocumentReference incident = fingerprintDoc(key);
            DocumentSnapshot incidentState = transaction.get(incident).get();
            if (dailyBudgetSpent(globalState, now) || burstSpent(globalState, now) || capped(incidentState, now)) {
                return Optional.empty();
            }
            if (recent(incidentState, "inFlightAt", now, IN_FLIGHT_WINDOW)) {
                return Optional.empty();
            }
            List<Map<String, Object>> pending = openReservations(globalState, now);
            pending.add(Map.of("owner", reservation.owner(), "reservedAt", timestamp(now)));
            transaction.set(incident, Map.of("owner", reservation.owner(), "inFlightAt", timestamp(now)),
                    SetOptions.merge());
            transaction.set(global, Map.of(PENDING_RESERVATIONS, pending), SetOptions.merge());
            return Optional.of(reservation);
        });
    }

    @Override
    public void complete(Reservation reservation, String fingerprint) {
        String key = key(fingerprint == null || fingerprint.isBlank() ? reservation.fingerprint() : fingerprint);
        Instant now = clock.instant();
        run(transaction -> {
            DocumentSnapshot globalState = transaction.get(global).get();
            DocumentReference incident = fingerprintDoc(key);
            DocumentSnapshot incidentState = transaction.get(incident).get();
            if (!owned(incidentState, reservation)) {
                throw new IllegalStateException("Error alert reservation is no longer owned");
            }
            List<Timestamp> sends = recentSends(globalState, now);
            sends.add(timestamp(now));
            List<Map<String, Object>> pending = withoutOwner(openReservations(globalState, now), reservation);
            Timestamp opened = incidentState.getTimestamp("openedAt");
            Instant openedAt = opened == null ? null : opened.toDate().toInstant();
            if (openedAt == null || !openedAt.isAfter(now.minus(SMS_INCIDENT_WINDOW))) {
                openedAt = now;
            }
            Map<String, Object> incidentUpdate = new LinkedHashMap<>();
            incidentUpdate.put("owner", FieldValue.delete());
            incidentUpdate.put("inFlightAt", FieldValue.delete());
            incidentUpdate.put("sentCount", (long) recordedSends(incidentState, now) + 1);
            incidentUpdate.put("openedAt", timestamp(openedAt));
            String sms = incidentState.getString("sms");
            if (sms != null && !sms.isBlank()) {
                incidentUpdate.put("smsSavedAt", timestamp(now));
            }
            transaction.set(incident, incidentUpdate, SetOptions.merge());
            transaction.set(global, Map.of(
                    "lastSentAt", timestamp(now), "recentSends", sends, PENDING_RESERVATIONS, pending),
                    SetOptions.merge());
            return null;
        });
    }

    @Override
    public void release(Reservation reservation) {
        if (reservation.fingerprint() == null || reservation.fingerprint().isBlank()) {
            return;
        }
        Instant now = clock.instant();
        run(transaction -> {
            DocumentSnapshot globalState = transaction.get(global).get();
            DocumentReference incident = fingerprintDoc(reservation.fingerprint());
            DocumentSnapshot incidentState = transaction.get(incident).get();
            if (owned(incidentState, reservation)) {
                Map<String, Object> cleared = new LinkedHashMap<>();
                cleared.put("owner", FieldValue.delete());
                cleared.put("inFlightAt", FieldValue.delete());
                // sms without sentCount means the incident already paged. This attempt
                // never published, so remove that pair and let the retry send.
                if (incidentState.get("sentCount") == null) {
                    cleared.put("sms", FieldValue.delete());
                    cleared.put("smsSavedAt", FieldValue.delete());
                }
                transaction.set(incident, cleared, SetOptions.merge());
                transaction.set(global, Map.of(PENDING_RESERVATIONS,
                        withoutOwner(openReservations(globalState, now), reservation)), SetOptions.merge());
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
            if (e.getCause() instanceof RuntimeException runtime) {
                throw runtime;
            }
            if (e instanceof RuntimeException runtime) {
                throw runtime;
            }
            throw new IllegalStateException("Error alert reservation failed", e);
        }
    }

    @Override
    public Optional<String> smsFor(String fingerprint) {
        Instant now = clock.instant();
        return run(transaction -> {
            DocumentReference doc = fingerprintDoc(fingerprint);
            DocumentSnapshot state = transaction.get(doc).get();
            if (!smsActive(state, now)) {
                return Optional.empty();
            }
            return Optional.of(state.getString("sms"));
        });
    }

    @Override
    public void rememberSms(String fingerprint, String sms) {
        Instant now = clock.instant();
        run(transaction -> {
            DocumentReference doc = fingerprintDoc(fingerprint);
            DocumentSnapshot state = transaction.get(doc).get();
            if (smsActive(state, now)) {
                return null;
            }
            transaction.set(doc, Map.of("sms", sms, "smsSavedAt", timestamp(now)), SetOptions.merge());
            return null;
        });
    }

    private DocumentReference fingerprintDoc(String fingerprint) {
        return db.collection(COLLECTION).document(fingerprint);
    }

    private static String key(String fingerprint) {
        return fingerprint == null || fingerprint.isBlank() ? "_unkeyed" : fingerprint;
    }

    private static boolean capped(DocumentSnapshot state, Instant now) {
        if (recordedSends(state, now) >= INCIDENT_LIMIT) {
            return true;
        }
        return state.exists() && state.get("sentCount") == null && smsActive(state, now);
    }

    private static int recordedSends(DocumentSnapshot state, Instant now) {
        if (!state.exists()) {
            return 0;
        }
        Timestamp opened = state.getTimestamp("openedAt");
        if (opened != null && !opened.toDate().toInstant().isAfter(now.minus(SMS_INCIDENT_WINDOW))) {
            return 0;
        }
        Object count = state.get("sentCount");
        return count instanceof Number number ? number.intValue() : 0;
    }

    private static boolean smsActive(DocumentSnapshot state, Instant now) {
        if (!state.exists()) {
            return false;
        }
        String sms = state.getString("sms");
        return sms != null && !sms.isBlank() && recent(state, "smsSavedAt", now, SMS_INCIDENT_WINDOW);
    }

    private static boolean owned(DocumentSnapshot state, Reservation reservation) {
        return state.exists() && reservation.owner().equals(state.getString("owner"));
    }

    private static boolean recent(DocumentSnapshot state, String field, Instant now, Duration window) {
        Timestamp value = state.exists() ? state.getTimestamp(field) : null;
        return value != null && value.toDate().toInstant().isAfter(now.minus(window));
    }

    private static boolean dailyBudgetSpent(DocumentSnapshot state, Instant now) {
        return recentSends(state, now).size() + openReservations(state, now).size() >= DAILY_LIMIT;
    }

    private static boolean burstSpent(DocumentSnapshot state, Instant now) {
        int recent = 0;
        for (Timestamp sent : recentSends(state, now)) {
            if (sent.toDate().toInstant().isAfter(now.minus(DEDUP_WINDOW))) {
                recent++;
            }
        }
        return recent + openReservations(state, now).size() >= BURST_LIMIT;
    }

    private static List<Map<String, Object>> openReservations(DocumentSnapshot state, Instant now) {
        List<Map<String, Object>> open = new ArrayList<>();
        Object values = state.exists() ? state.get(PENDING_RESERVATIONS) : null;
        if (values instanceof List<?> list) {
            for (Object value : list) {
                if (!(value instanceof Map<?, ?> raw)) {
                    continue;
                }
                Object reservedAt = raw.get("reservedAt");
                Object owner = raw.get("owner");
                if (owner instanceof String ownerId && reservedAt instanceof Timestamp time
                        && time.toDate().toInstant().isAfter(now.minus(IN_FLIGHT_WINDOW))) {
                    open.add(Map.of("owner", ownerId, "reservedAt", time));
                }
            }
        }
        return open;
    }

    private static List<Map<String, Object>> withoutOwner(List<Map<String, Object>> pending, Reservation reservation) {
        pending.removeIf(entry -> reservation.owner().equals(entry.get("owner")));
        return pending;
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
