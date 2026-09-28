package com.functions.payments.completion.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.EnumMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.Before;
import org.junit.Test;

import com.functions.payments.completion.handlers.FulfilmentCompletionHandler;
import com.functions.payments.completion.handlers.FulfilmentCompletionHandlerRegistry;
import com.functions.payments.completion.models.EnqueueCommand;
import com.functions.payments.completion.models.FulfilmentCompletionJobStatus;
import com.functions.payments.completion.models.FulfilmentCompletionJobType;
import com.functions.payments.completion.models.JobIds;
import com.functions.payments.completion.models.ProcessDueSummary;
import com.functions.payments.completion.models.ProcessJobOutcome;
import com.functions.payments.completion.models.ProcessJobResult;
import com.functions.payments.completion.repositories.InMemoryFulfilmentCompletionJobStore;

public class FulfilmentCompletionWorkerTest {
    private InMemoryFulfilmentCompletionJobStore store;
    private MutableClock clock;
    private FulfilmentCompletionQueue queue;

    @Before
    public void setUp() {
        store = new InMemoryFulfilmentCompletionJobStore();
        clock = new MutableClock(Instant.parse("2026-09-21T00:00:00Z"));
        queue = new FulfilmentCompletionQueue(store, clock);
    }

    @Test
    public void secondClaimIsSkippedWhileLeaseHeld() throws Exception {
        FulfilmentCompletionHandler hanging = job -> {
            throw new IllegalStateException("should not run twice");
        };
        AtomicInteger calls = new AtomicInteger();
        FulfilmentCompletionHandler firstOnly = job -> {
            if (calls.incrementAndGet() > 0 && calls.get() != 1) {
                throw new IllegalStateException("handler called more than once before fail");
            }
        };

        queue.enqueue(command("cs_1"));
        FulfilmentCompletionWorker worker = new FulfilmentCompletionWorker(
                store, registry(firstOnly), clock);
        assertEquals(ProcessJobResult.PROCESSED, worker.processJob(JobIds.of("stripe", "cs_1")).result());

        FulfilmentCompletionWorker other = new FulfilmentCompletionWorker(store, registry(hanging), clock);
        ProcessJobOutcome skipped = other.processJob(JobIds.of("stripe", "cs_1"));
        assertEquals(ProcessJobResult.SKIPPED_NOT_DUE, skipped.result());
        assertEquals(FulfilmentCompletionJobStatus.SUCCEEDED, skipped.status());
    }

    @Test
    public void runningJobIsNotReclaimedUntilLeaseExpires() throws Exception {
        AtomicInteger started = new AtomicInteger();
        FulfilmentCompletionHandler blockAfterClaim = job -> started.incrementAndGet();

        queue.enqueue(command("cs_1"));
        String jobId = JobIds.of("stripe", "cs_1");
        FulfilmentCompletionWorker worker = new FulfilmentCompletionWorker(store, registry(blockAfterClaim), clock);
        worker.processJob(jobId);

        store.runTransaction(access -> {
            var job = access.get(jobId).orElseThrow();
            job.setStatus(FulfilmentCompletionJobStatus.RUNNING);
            job.setLeaseUntil(com.google.cloud.Timestamp.of(java.util.Date.from(clock.instant().plusSeconds(60))));
            access.update(job);
            return null;
        });

        ProcessJobOutcome skipped = worker.processJob(jobId);
        assertEquals(ProcessJobResult.SKIPPED_NOT_DUE, skipped.result());

        clock.advance(Duration.ofSeconds(61));
        ProcessJobOutcome reclaimed = worker.processJob(jobId);
        assertEquals(ProcessJobResult.PROCESSED, reclaimed.result());
        assertEquals(2, started.get());
    }

    @Test
    public void handlerFailureRetriesThenPoisons() throws Exception {
        FulfilmentCompletionHandler failing = job -> {
            throw new RuntimeException("boom");
        };
        FulfilmentCompletionWorker worker = new FulfilmentCompletionWorker(store, registry(failing), clock);
        queue.enqueue(command("cs_1"));
        String jobId = JobIds.of("stripe", "cs_1");

        for (int attempt = 1; attempt < FulfilmentCompletionWorker.MAX_ATTEMPTS; attempt++) {
            ProcessJobOutcome outcome = worker.processJob(jobId);
            assertEquals(ProcessJobResult.HANDLER_FAILED, outcome.result());
            assertEquals(FulfilmentCompletionJobStatus.FAILED, outcome.status());
            assertEquals("boom", outcome.lastError());
            clock.advance(Duration.ofSeconds(FulfilmentCompletionWorker.BACKOFF_SECONDS * attempt + 1));
        }

        ProcessJobOutcome poisoned = worker.processJob(jobId);
        assertEquals(ProcessJobResult.HANDLER_FAILED, poisoned.result());
        assertEquals(FulfilmentCompletionJobStatus.POISON, poisoned.status());

        clock.advance(Duration.ofDays(1));
        ProcessJobOutcome ignored = worker.processJob(jobId);
        assertEquals(ProcessJobResult.SKIPPED_NOT_DUE, ignored.result());
        assertEquals(FulfilmentCompletionJobStatus.POISON, store.get(jobId).orElseThrow().getStatus());
    }

    @Test
    public void processDueJobsSkipsSucceeded() throws Exception {
        FulfilmentCompletionWorker worker = new FulfilmentCompletionWorker(
                store, FulfilmentCompletionHandlerRegistry.noOp(), clock);
        queue.enqueue(command("cs_1"));
        worker.processJob(JobIds.of("stripe", "cs_1"));

        ProcessDueSummary summary = worker.processDueJobs(10);
        assertEquals(0, summary.processed());
        assertTrue(summary.jobs().isEmpty());
    }

    @Test
    public void processUnknownJobReturnsNotFound() throws Exception {
        FulfilmentCompletionWorker worker = new FulfilmentCompletionWorker(
                store, FulfilmentCompletionHandlerRegistry.noOp(), clock);
        ProcessJobOutcome outcome = worker.processJob("missing");
        assertEquals(ProcessJobResult.NOT_FOUND, outcome.result());
    }

    private static EnqueueCommand command(String paymentRef) {
        return new EnqueueCommand("stripe", paymentRef, FulfilmentCompletionJobType.SUCCESS, null, null, null);
    }

    private static FulfilmentCompletionHandlerRegistry registry(FulfilmentCompletionHandler successHandler) {
        Map<FulfilmentCompletionJobType, FulfilmentCompletionHandler> handlers =
                new EnumMap<>(FulfilmentCompletionJobType.class);
        for (FulfilmentCompletionJobType type : FulfilmentCompletionJobType.values()) {
            handlers.put(type, job -> {
            });
        }
        handlers.put(FulfilmentCompletionJobType.SUCCESS, successHandler);
        return new FulfilmentCompletionHandlerRegistry(handlers);
    }

    private static final class MutableClock extends Clock {
        private Instant instant;

        private MutableClock(Instant instant) {
            this.instant = instant;
        }

        void advance(Duration duration) {
            instant = instant.plus(duration);
        }

        @Override
        public ZoneOffset getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}
