package com.functions.alerts.repositories;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.Before;
import org.junit.Test;

import com.functions.alerts.clients.ErrorAlertDedupStore.Reservation;
import com.google.api.core.ApiFutures;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.SetOptions;
import com.google.cloud.firestore.Transaction;

public class ErrorAlertDedupRepositoryTest {
    private static final Instant NOW = Instant.parse("2026-10-11T03:00:00Z");

    private Firestore db;
    private CollectionReference collection;
    private Transaction transaction;
    private Map<String, DocumentReference> docs;
    private Map<String, Map<String, Object>> state;

    @Before
    public void setUp() throws Exception {
        db = mock(Firestore.class);
        collection = mock(CollectionReference.class);
        transaction = mock(Transaction.class);
        docs = new LinkedHashMap<>();
        state = new LinkedHashMap<>();
        boolean[] wrote = { false };
        when(db.collection(ErrorAlertDedupRepository.COLLECTION)).thenReturn(collection);
        when(collection.document(anyString())).thenAnswer(invocation -> doc(invocation.getArgument(0)));
        when(transaction.get(any(DocumentReference.class))).thenAnswer(invocation -> {
            if (wrote[0]) {
                throw new IllegalArgumentException(
                        "Firestore transactions require all reads to be executed before all writes.");
            }
            DocumentReference ref = invocation.getArgument(0);
            return ApiFutures.immediateFuture(snapshot(idOf(ref)));
        });
        when(transaction.set(any(DocumentReference.class), any(Map.class), any(SetOptions.class)))
                .thenAnswer(invocation -> {
                    wrote[0] = true;
                    merge(idOf(invocation.getArgument(0)), invocation.getArgument(1));
                    return transaction;
                });
        when(transaction.update(any(DocumentReference.class), any(Map.class))).thenAnswer(invocation -> {
            wrote[0] = true;
            merge(idOf(invocation.getArgument(0)), invocation.getArgument(1));
            return transaction;
        });
        when(db.runTransaction(any(Transaction.Function.class))).thenAnswer(invocation -> {
            wrote[0] = false;
            Transaction.Function<?> callback = invocation.getArgument(0);
            try {
                return ApiFutures.immediateFuture(callback.updateCallback(transaction));
            } catch (Exception failure) {
                return ApiFutures.immediateFailedFuture(failure);
            }
        });
    }

    @Test
    public void smsFor_doesNotWriteActivityTimestamp() {
        Timestamp saved = Timestamp.ofTimeSecondsAndNanos(NOW.getEpochSecond(), 0);
        state.put("fp1", new LinkedHashMap<>(Map.of(
                "sms", "Email service returned 503.",
                "smsSavedAt", saved)));
        ErrorAlertDedupRepository repository = repository(NOW);

        assertEquals("Email service returned 503.", repository.smsFor("fp1").orElseThrow());
        verify(transaction, never()).set(any(), any(), any());
        verify(transaction, never()).update(any(), any(Map.class));
        assertEquals(saved, state.get("fp1").get("smsSavedAt"));
    }

    @Test
    public void complete_advancesSmsSavedAtAlongsideLastSentAt() {
        ErrorAlertDedupRepository daySix = repository(NOW.plus(Duration.ofDays(6)));
        Reservation reservation = daySix.reserve("fp1").orElseThrow();
        daySix.rememberSms("fp1", "Email service returned 503.");
        Timestamp original = (Timestamp) state.get("fp1").get("smsSavedAt");
        daySix.complete(reservation, "fp1");

        Timestamp moved = (Timestamp) state.get("fp1").get("smsSavedAt");
        assertTrue(moved.getSeconds() >= original.getSeconds());
        assertEquals(1L, ((Number) state.get("fp1").get("sentCount")).longValue());
        assertNotNull(state.get("_global").get("lastSentAt"));
        assertEquals("Email service returned 503.",
                repository(NOW.plus(Duration.ofDays(8))).smsFor("fp1").orElseThrow());
        assertTrue(repository(NOW.plus(Duration.ofDays(14))).smsFor("fp1").isEmpty());
    }

    @Test
    public void reserve_stopsAtThreeForOneErrorAndLeavesAnotherOpen() {
        ErrorAlertDedupRepository repository = repository(NOW);
        for (int sent = 0; sent < ErrorAlertDedupRepository.INCIDENT_LIMIT; sent++) {
            Reservation reservation = repository.reserve("booking").orElseThrow();
            repository.complete(reservation, "booking");
        }
        assertTrue(repository.reserve("booking").isEmpty());
        assertTrue(repository.reserve("checkout").isPresent());
    }

    @Test
    public void reserve_acksSameErrorWhileItsSendIsInFlight() {
        ErrorAlertDedupRepository repository = repository(NOW);
        assertTrue(repository.reserve("booking").isPresent());
        assertTrue(repository.reserve("booking").isEmpty());
        assertTrue(repository.reserve("checkout").isPresent());
        assertEquals(2, ((List<?>) state.get("_global").get("pendingReservations")).size());
    }

    @Test
    public void reserve_holdsDailyBudgetUntilTheSendFinishesOrIsReleased() {
        List<Timestamp> sends = java.util.Collections.nCopies(19,
                Timestamp.ofTimeSecondsAndNanos(NOW.minus(Duration.ofHours(2)).getEpochSecond(), 0));
        state.put("_global", new LinkedHashMap<>(Map.of("recentSends", sends)));
        ErrorAlertDedupRepository repository = repository(NOW);
        Reservation held = repository.reserve("booking").orElseThrow();
        assertTrue(repository.reserve("checkout").isEmpty());

        repository.release(held);
        Reservation replacement = repository.reserve("checkout").orElseThrow();
        repository.complete(replacement, "checkout");
        assertEquals(20, ((List<?>) state.get("_global").get("recentSends")).size());
        assertTrue(repository.reserve("refund").isEmpty());
    }

    @Test
    public void reserve_doesNotRepeatAnErrorThatAlreadyHasSmsAndNoCount() {
        state.put("booking", new LinkedHashMap<>(Map.of(
                "sms", "Booking cron failed.",
                "smsSavedAt", Timestamp.ofTimeSecondsAndNanos(NOW.getEpochSecond(), 0))));
        assertTrue(repository(NOW).reserve("booking").isEmpty());
        assertTrue(repository(NOW).reserve("checkout").isPresent());
    }

    @Test
    public void failedLookupWithoutComplete_expiresAfterSevenDays() {
        state.put("fp1", new LinkedHashMap<>(Map.of(
                "sms", "Email service returned 503.",
                "smsSavedAt", Timestamp.ofTimeSecondsAndNanos(NOW.getEpochSecond(), 0))));
        ErrorAlertDedupRepository daySix = repository(NOW.plus(Duration.ofDays(6)));
        assertEquals("Email service returned 503.", daySix.smsFor("fp1").orElseThrow());
        verify(transaction, never()).set(eq(doc("fp1")), any(), any());
        assertTrue(repository(NOW.plus(Duration.ofDays(8))).smsFor("fp1").isEmpty());
    }

    private ErrorAlertDedupRepository repository(Instant now) {
        return new ErrorAlertDedupRepository(db, Clock.fixed(now, ZoneOffset.UTC));
    }

    private DocumentReference doc(String id) {
        return docs.computeIfAbsent(id, ignored -> {
            DocumentReference ref = mock(DocumentReference.class, "doc:" + id);
            when(ref.getId()).thenReturn(id);
            return ref;
        });
    }

    private String idOf(DocumentReference ref) {
        for (Map.Entry<String, DocumentReference> entry : docs.entrySet()) {
            if (entry.getValue() == ref) {
                return entry.getKey();
            }
        }
        throw new AssertionError("Unknown document " + ref);
    }

    private DocumentSnapshot snapshot(String id) {
        DocumentSnapshot snapshot = mock(DocumentSnapshot.class);
        Map<String, Object> fields = state.get(id);
        when(snapshot.exists()).thenReturn(fields != null);
        if (fields != null) {
            when(snapshot.getString("sms")).thenReturn((String) fields.get("sms"));
            when(snapshot.getString("owner")).thenReturn((String) fields.get("owner"));
            when(snapshot.getTimestamp(anyString())).thenAnswer(invocation -> {
                Object value = fields.get(invocation.getArgument(0));
                return value instanceof Timestamp timestamp ? timestamp : null;
            });
            when(snapshot.get(anyString())).thenAnswer(invocation -> fields.get(invocation.getArgument(0)));
        }
        return snapshot;
    }

    @SuppressWarnings("unchecked")
    private void merge(String id, Map<String, Object> updates) {
        Map<String, Object> fields = state.computeIfAbsent(id, ignored -> new LinkedHashMap<>());
        for (Map.Entry<String, Object> update : updates.entrySet()) {
            if (update.getValue() instanceof FieldValue) {
                fields.remove(update.getKey());
            } else {
                fields.put(update.getKey(), update.getValue());
            }
        }
    }
}
