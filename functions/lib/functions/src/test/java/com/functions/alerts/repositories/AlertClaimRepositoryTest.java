package com.functions.alerts.repositories;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.Map;

import org.junit.Before;
import org.junit.Test;

import com.functions.alerts.clients.AlertClaimStore.Claim;
import com.google.api.core.ApiFutures;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;

public class AlertClaimRepositoryTest {
    private static final Instant NOW = Instant.parse("2026-11-09T04:00:00Z");

    private Firestore db;
    private Transaction transaction;
    private Map<String, DocumentReference> docs;
    private Map<String, Map<String, Object>> state;
    private boolean transactionWrote;

    @Before
    public void setUp() {
        db = mock(Firestore.class);
        CollectionReference collection = mock(CollectionReference.class);
        transaction = mock(Transaction.class);
        docs = new LinkedHashMap<>();
        state = new LinkedHashMap<>();
        when(db.collection(AlertClaimRepository.COLLECTION)).thenReturn(collection);
        when(collection.document(anyString())).thenAnswer(invocation -> doc(invocation.getArgument(0)));
        when(transaction.get(any(DocumentReference.class))).thenAnswer(invocation -> {
            if (transactionWrote) {
                throw new IllegalStateException("Firestore transactions require all reads to be executed before all writes");
            }
            return ApiFutures.immediateFuture(snapshot(idOf(invocation.getArgument(0))));
        });
        when(transaction.set(any(DocumentReference.class), any(Map.class))).thenAnswer(invocation -> {
            transactionWrote = true;
            state.put(idOf(invocation.getArgument(0)), new LinkedHashMap<>(invocation.<Map<String, Object>>getArgument(1)));
            return transaction;
        });
        when(transaction.update(any(DocumentReference.class), any(Map.class))).thenAnswer(invocation -> {
            transactionWrote = true;
            Map<String, Object> fields = state.get(idOf(invocation.getArgument(0)));
            if (fields == null) {
                throw new IllegalStateException("NOT_FOUND: update on a missing document");
            }
            fields.put(AlertClaimRepository.COUNT, ((Long) fields.get(AlertClaimRepository.COUNT)) - 1);
            return transaction;
        });
        when(transaction.delete(any(DocumentReference.class))).thenAnswer(invocation -> {
            transactionWrote = true;
            state.remove(idOf(invocation.getArgument(0)));
            return transaction;
        });
        when(db.runTransaction(any(Transaction.Function.class))).thenAnswer(invocation -> {
            Transaction.Function<?> callback = invocation.getArgument(0);
            transactionWrote = false;
            try {
                return ApiFutures.immediateFuture(callback.updateCallback(transaction));
            } catch (Exception failure) {
                return ApiFutures.immediateFailedFuture(failure);
            }
        });
    }

    @Test
    public void claim_blocksSameFingerprintAndAnyAlertInsideTheGlobalWindow() {
        AlertClaimRepository repository = repository(NOW);

        assertTrue(repository.claim("fp-webhook").isPresent());
        assertFalse(repository.claim("fp-webhook").isPresent());
        assertFalse(repository.claim("fp-cron").isPresent());
    }

    @Test
    public void claim_reclaimsExpiredWindowsBeforeTtlDeletesThem() {
        assertTrue(repository(NOW).claim("fp-webhook").isPresent());

        AlertClaimRepository afterGlobalWindow = repository(NOW.plus(AlertClaimRepository.GLOBAL_WINDOW).plusSeconds(1));
        assertFalse(afterGlobalWindow.claim("fp-webhook").isPresent());
        assertTrue(afterGlobalWindow.claim("fp-cron").isPresent());

        assertTrue(repository(NOW.plus(AlertClaimRepository.FINGERPRINT_WINDOW).plusSeconds(1)).claim("fp-webhook").isPresent());
    }

    @Test
    public void claim_stopsAtTheDailyBudgetAndStoresTtlExpiries() {
        for (int i = 0; i < AlertClaimRepository.DAILY_LIMIT; i++) {
            assertTrue(repository(NOW.plus(AlertClaimRepository.GLOBAL_WINDOW.multipliedBy(i))).claim("fp-" + i).isPresent());
        }
        Instant later = NOW.plus(AlertClaimRepository.GLOBAL_WINDOW.multipliedBy(AlertClaimRepository.DAILY_LIMIT));
        assertFalse(repository(later).claim("fp-over-budget").isPresent());
        assertTrue(repository(NOW.plus(Duration.ofDays(1))).claim("fp-next-day").isPresent());

        Timestamp expireAt = (Timestamp) state.get("fingerprint-fp-0").get(AlertClaimRepository.EXPIRE_AT);
        assertEquals(NOW.plus(AlertClaimRepository.FINGERPRINT_WINDOW).getEpochSecond(), expireAt.getSeconds());
    }

    @Test
    public void release_freesTheWindowsAndBudget() {
        AlertClaimRepository repository = repository(NOW);
        Claim claim = repository.claim("fp-webhook").orElseThrow();

        repository.release(claim);

        assertTrue(repository.claim("fp-webhook").isPresent());
        assertEquals(1L, state.get("day-2026-11-09").get(AlertClaimRepository.COUNT));
    }

    @Test
    public void release_refundsTheDayThatWasChargedEvenAfterMidnight() {
        Claim claim = repository(Instant.parse("2026-11-09T23:59:59Z")).claim("fp-webhook").orElseThrow();

        repository(Instant.parse("2026-11-10T00:00:30Z")).release(claim);

        assertEquals(0L, state.get("day-2026-11-09").get(AlertClaimRepository.COUNT));
        assertFalse(state.containsKey("day-2026-11-10"));
    }

    private AlertClaimRepository repository(Instant now) {
        return new AlertClaimRepository(db, Clock.fixed(now, ZoneOffset.UTC));
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
            when(snapshot.getLong(anyString())).thenAnswer(invocation -> (Long) fields.get(invocation.getArgument(0)));
            when(snapshot.getTimestamp(anyString())).thenAnswer(invocation -> {
                Object value = fields.get(invocation.getArgument(0));
                return value instanceof Timestamp timestamp ? timestamp : null;
            });
        }
        return snapshot;
    }
}
