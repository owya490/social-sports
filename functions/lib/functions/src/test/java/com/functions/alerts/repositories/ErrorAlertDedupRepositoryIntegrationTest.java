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
    public void reserve_concurrentlyOwnsExactlyOneSlotForTheSameError() throws Exception {
        var pool = Executors.newFixedThreadPool(4);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Optional<Reservation>>> attempts = new ArrayList<>();
        try {
            for (int i = 0; i < 4; i++) {
                attempts.add(pool.submit(() -> {
                    start.await();
                    return repository.reserve("booking");
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
        } finally {
            pool.shutdownNow();
        }
    }

    @Test
    public void complete_capsTheSameErrorAndLeavesAnotherErrorOpen() throws Exception {
        for (int sent = 0; sent < ErrorAlertDedupRepository.INCIDENT_LIMIT; sent++) {
            repository.complete(repository.reserve("booking").orElseThrow(), "booking");
        }
        assertTrue(repository.reserve("booking").isEmpty());
        assertTrue(repository.reserve("checkout").isPresent());
        assertNotNull(db.collection(ErrorAlertDedupRepository.COLLECTION).document("_global").get().get()
                .getTimestamp("lastSentAt"));
        assertEquals(3L, db.collection(ErrorAlertDedupRepository.COLLECTION).document("booking").get().get()
                .getLong("sentCount").longValue());
    }

    @Test
    public void release_allowsRetryAndStaleOwnersCannotCompleteOrReleaseTheNewLease() throws Exception {
        Reservation first = repository.reserve("booking").orElseThrow();
        repository.release(first);
        Reservation second = repository.reserve("booking").orElseThrow();
        repository.release(first);
        try {
            repository.complete(first, "booking");
            fail("Stale completion must fail");
        } catch (IllegalStateException expected) {
            assertEquals(second.owner(), db.collection(ErrorAlertDedupRepository.COLLECTION)
                    .document("booking").get().get().getString("owner"));
        }
        repository.complete(second, "booking");
    }

    @Test
    public void reserve_acksSameErrorWhileItsSendIsInFlight() {
        repository.reserve("booking").orElseThrow();
        assertTrue(repository.reserve("booking").isEmpty());
        assertTrue(repository.reserve("checkout").isPresent());
    }

    @Test
    public void rememberSms_persistsFirstValueAndReusesIt() throws Exception {
        assertTrue(repository.smsFor("fp1").isEmpty());
        repository.rememberSms("fp1", "First SMS sentence.");
        repository.rememberSms("fp1", "Different Gemini wording.");
        assertEquals("First SMS sentence.", repository.smsFor("fp1").orElseThrow());
        assertNotNull(db.collection(ErrorAlertDedupRepository.COLLECTION).document("fp1").get().get()
                .getTimestamp("smsSavedAt"));
    }

    @Test
    public void rememberSms_overwritesAfterIncidentWindow() {
        repository.rememberSms("fp1", "Email service returned 503.");
        ErrorAlertDedupRepository later = new ErrorAlertDedupRepository(db,
                Clock.fixed(NOW.plus(ErrorAlertDedupRepository.SMS_INCIDENT_WINDOW).plusSeconds(1), ZoneOffset.UTC));
        assertTrue(later.smsFor("fp1").isEmpty());
        later.rememberSms("fp1", "Email service returned 403.");
        assertEquals("Email service returned 403.", later.smsFor("fp1").orElseThrow());
    }

    @Test
    public void smsFor_doesNotAdvanceActivity_completeDoes() throws Exception {
        repository.rememberSms("lookup", "Email service returned 503.");
        Timestamp lookupSaved = db.collection(ErrorAlertDedupRepository.COLLECTION).document("lookup").get().get()
                .getTimestamp("smsSavedAt");
        ErrorAlertDedupRepository daySix = new ErrorAlertDedupRepository(db,
                Clock.fixed(NOW.plus(Duration.ofDays(6)), ZoneOffset.UTC));
        assertEquals("Email service returned 503.", daySix.smsFor("lookup").orElseThrow());
        assertEquals(lookupSaved, db.collection(ErrorAlertDedupRepository.COLLECTION).document("lookup").get().get()
                .getTimestamp("smsSavedAt"));

        Reservation reservation = daySix.reserve("fresh").orElseThrow();
        daySix.rememberSms("fresh", "Email service returned 503.");
        daySix.complete(reservation, "fresh");
        Timestamp sentSaved = db.collection(ErrorAlertDedupRepository.COLLECTION).document("fresh").get().get()
                .getTimestamp("smsSavedAt");
        assertTrue(sentSaved.getSeconds() > lookupSaved.getSeconds());

        ErrorAlertDedupRepository dayEight = new ErrorAlertDedupRepository(db,
                Clock.fixed(NOW.plus(Duration.ofDays(8)), ZoneOffset.UTC));
        assertTrue(dayEight.smsFor("lookup").isEmpty());
        assertEquals("Email service returned 503.", dayEight.smsFor("fresh").orElseThrow());
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
    public void reserve_concurrentDifferentErrorsCannotExceedTheDailyBudget() throws Exception {
        var global = db.collection(ErrorAlertDedupRepository.COLLECTION).document("_global");
        List<Timestamp> sends = java.util.Collections.nCopies(19,
                Timestamp.ofTimeSecondsAndNanos(NOW.minus(Duration.ofHours(2)).getEpochSecond(), 0));
        global.set(Map.of("recentSends", sends)).get();
        var pool = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Optional<Reservation>>> attempts = new ArrayList<>();
        try {
            for (String fingerprint : List.of("booking", "checkout")) {
                attempts.add(pool.submit(() -> {
                    start.await();
                    return repository.reserve(fingerprint);
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
        } finally {
            pool.shutdownNow();
        }
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
