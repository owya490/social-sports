package com.functions.alerts.repositories;

import static org.junit.Assert.*;
import static org.junit.Assume.assumeTrue;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import com.functions.alerts.clients.ErrorAlertDedupStore.Reservation;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;

public class ErrorAlertDedupRepositoryIntegrationTest {
    private static final Instant NOW = Instant.parse("2026-10-11T03:00:00Z");
    private Firestore db;
    private ErrorAlertDedupRepository repository;

    @Before
    public void setUp() {
        String emulator = System.getenv("FIRESTORE_EMULATOR_HOST");
        assumeTrue("Requires the local Firestore emulator", emulator != null);
        if (!emulator.matches("(localhost|127\\.0\\.0\\.1):[0-9]+")) {
            throw new IllegalStateException("Integration tests require a localhost emulator");
        }
        db = FirestoreOptions.newBuilder().setProjectId("alert-test-" + UUID.randomUUID().toString().substring(0, 8))
                .build().getService();
        repository = new ErrorAlertDedupRepository(db, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @After
    public void tearDown() throws Exception {
        if (db != null) {
            db.close();
        }
    }

    @Test
    public void reserve_concurrentlyOwnsExactlyOneGlobalSlot() throws Exception {
        var pool = Executors.newFixedThreadPool(4);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Optional<Reservation>>> attempts = new ArrayList<>();
        try {
            for (int i = 0; i < 4; i++) {
                attempts.add(pool.submit(() -> {
                    start.await();
                    try {
                        return repository.reserve();
                    } catch (IllegalStateException busy) {
                        Throwable cause = busy;
                        while (cause.getCause() != null) {
                            cause = cause.getCause();
                        }
                        assertTrue(cause.getMessage().contains("in progress"));
                        return Optional.empty();
                    }
                }));
            }
            start.countDown();
            int owned = 0;
            for (Future<Optional<Reservation>> attempt : attempts) {
                if (attempt.get(25, TimeUnit.SECONDS).isPresent()) {
                    owned++;
                }
            }
            assertEquals(1, owned);
            assertEquals(1, db.collection(ErrorAlertDedupRepository.COLLECTION).get().get().size());
        } finally {
            pool.shutdownNow();
        }
    }

    @Test
    public void complete_appliesCooldownAndOnlyKeepsGlobalState() throws Exception {
        repository.complete(repository.reserve().orElseThrow());
        assertTrue(repository.reserve().isEmpty());
        assertEquals(1, db.collection(ErrorAlertDedupRepository.COLLECTION).get().get().size());
        assertNotNull(db.collection(ErrorAlertDedupRepository.COLLECTION).document("_global").get().get()
                .getTimestamp("lastSentAt"));
        ErrorAlertDedupRepository later = new ErrorAlertDedupRepository(db,
                Clock.fixed(NOW.plus(ErrorAlertDedupRepository.DEDUP_WINDOW).plusSeconds(1), ZoneOffset.UTC));
        assertTrue(later.reserve().isPresent());
        assertEquals(1, ((List<?>) db.collection(ErrorAlertDedupRepository.COLLECTION).document("_global")
                .get().get().get("recentSends")).size());
    }

    @Test
    public void release_allowsRetryAndStaleOwnersCannotCompleteOrReleaseTheNewLease() throws Exception {
        Reservation first = repository.reserve().orElseThrow();
        repository.release(first);
        Reservation second = repository.reserve().orElseThrow();
        repository.release(first);
        try {
            repository.complete(first);
            fail("Stale completion must fail");
        } catch (IllegalStateException expected) {
            assertEquals(second.owner(), db.collection(ErrorAlertDedupRepository.COLLECTION)
                    .document("_global").get().get().getString("owner"));
        }
        repository.complete(second);
    }

    @Test
    public void reserve_recoversExpiredLeases() {
        Reservation first = repository.reserve().orElseThrow();
        ErrorAlertDedupRepository later = new ErrorAlertDedupRepository(db,
                Clock.fixed(NOW.plus(ErrorAlertDedupRepository.IN_FLIGHT_WINDOW).plusSeconds(1), ZoneOffset.UTC));
        Reservation recovered = later.reserve().orElseThrow();
        assertNotEquals(first.owner(), recovered.owner());
        later.complete(recovered);
    }

    @Test
    public void reserve_enforcesRollingDailyBudgetAndPrunesExpiredSends() throws Exception {
        var global = db.collection(ErrorAlertDedupRepository.COLLECTION).document("_global");
        List<Timestamp> sends = java.util.Collections.nCopies(20,
                Timestamp.ofTimeSecondsAndNanos(NOW.minus(Duration.ofHours(2)).getEpochSecond(), 0));
        global.set(Map.of("recentSends", sends)).get();
        assertTrue(repository.reserve().isEmpty());
        sends = java.util.Collections.nCopies(20,
                Timestamp.ofTimeSecondsAndNanos(NOW.minus(Duration.ofHours(25)).getEpochSecond(), 0));
        global.set(Map.of("recentSends", sends)).get();
        repository.complete(repository.reserve().orElseThrow());
        assertEquals(1, ((List<?>) global.get().get().get("recentSends")).size());
    }
}
