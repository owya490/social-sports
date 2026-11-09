package com.functions.alerts.repositories;

import static org.junit.Assert.*;
import static org.junit.Assume.assumeTrue;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;

public class AlertClaimRepositoryIntegrationTest {
    private static final Instant NOW = Instant.parse("2026-11-09T04:00:00Z");

    private Firestore db;

    @Before
    public void setUp() {
        String emulator = System.getenv("FIRESTORE_EMULATOR_HOST");
        assumeTrue("Requires the local Firestore emulator", emulator != null);
        if (!emulator.matches("(localhost|127\\.0\\.0\\.1):[0-9]+")) {
            throw new IllegalStateException("Integration tests require a localhost emulator");
        }
        db = FirestoreOptions.newBuilder().setProjectId("alert-test-" + UUID.randomUUID().toString().substring(0, 8))
                .build().getService();
    }

    @After
    public void tearDown() throws Exception {
        if (db != null) {
            db.close();
        }
    }

    @Test
    public void claim_concurrentDeliveriesOfOneBurstPageExactlyOnce() throws Exception {
        AlertClaimRepository repository = repository(NOW);
        var pool = Executors.newFixedThreadPool(10);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Boolean>> attempts = new ArrayList<>();
        try {
            for (int i = 0; i < 10; i++) {
                String fingerprint = "fp-" + (i % 3);
                attempts.add(pool.submit(() -> {
                    start.await();
                    return repository.claim(fingerprint).isPresent();
                }));
            }
            start.countDown();
            int paged = 0;
            for (Future<Boolean> attempt : attempts) {
                if (attempt.get(25, TimeUnit.SECONDS)) {
                    paged++;
                }
            }
            assertEquals(1, paged);
        } finally {
            pool.shutdownNow();
        }
    }

    @Test
    public void claim_expiredDocumentsCanBeReclaimedAndReleaseFreesThem() {
        assertTrue(repository(NOW).claim("fp-webhook").isPresent());
        assertFalse(repository(NOW).claim("fp-webhook").isPresent());

        AlertClaimRepository later = repository(NOW.plus(AlertClaimRepository.FINGERPRINT_WINDOW).plusSeconds(1));
        later.release(later.claim("fp-webhook").orElseThrow());
        assertTrue(later.claim("fp-webhook").isPresent());
    }

    private AlertClaimRepository repository(Instant now) {
        return new AlertClaimRepository(db, Clock.fixed(now, ZoneOffset.UTC));
    }
}
