package com.functions.payments.completion.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import org.junit.Before;
import org.junit.Test;

import com.functions.payments.completion.handlers.FulfilmentCompletionHandlerRegistry;
import com.functions.payments.completion.models.EnqueueCommand;
import com.functions.payments.completion.models.EnqueueOutcome;
import com.functions.payments.completion.models.EnqueueResult;
import com.functions.payments.completion.models.FulfilmentCompletionJob;
import com.functions.payments.completion.models.FulfilmentCompletionJobStatus;
import com.functions.payments.completion.models.FulfilmentCompletionJobType;
import com.functions.payments.completion.models.JobIds;
import com.functions.payments.completion.models.ProcessJobOutcome;
import com.functions.payments.completion.models.ProcessJobResult;
import com.functions.payments.completion.repositories.InMemoryFulfilmentCompletionJobStore;

public class FulfilmentCompletionQueueTest {
    private InMemoryFulfilmentCompletionJobStore store;
    private FulfilmentCompletionQueue queue;

    @Before
    public void setUp() {
        store = new InMemoryFulfilmentCompletionJobStore();
        queue = new FulfilmentCompletionQueue(store, Clock.fixed(Instant.parse("2026-09-21T00:00:00Z"), ZoneOffset.UTC));
    }

    @Test
    public void enqueueCreatesPendingJob() throws Exception {
        EnqueueOutcome outcome = queue.enqueue(command("cs_1", FulfilmentCompletionJobType.SUCCESS));

        assertEquals(EnqueueResult.ENQUEUED, outcome.result());
        FulfilmentCompletionJob job = store.get(outcome.jobId()).orElseThrow();
        assertEquals(FulfilmentCompletionJobStatus.PENDING, job.getStatus());
        assertEquals("stripe", job.getProvider());
        assertEquals("cs_1", job.getPaymentRef());
        assertEquals(FulfilmentCompletionJobType.SUCCESS, job.getType());
        assertEquals(0, job.getAttemptCount());
    }

    @Test
    public void enqueueIsIdempotentForSameType() throws Exception {
        queue.enqueue(command("cs_1", FulfilmentCompletionJobType.SUCCESS));
        EnqueueOutcome second = queue.enqueue(command("cs_1", FulfilmentCompletionJobType.SUCCESS));

        assertEquals(EnqueueResult.ALREADY_ENQUEUED, second.result());
        assertEquals(JobIds.of("stripe", "cs_1"), second.jobId());
    }

    @Test
    public void enqueueConflictDoesNotOverwriteSuccessWithExpired() throws Exception {
        queue.enqueue(command("cs_1", FulfilmentCompletionJobType.SUCCESS));
        EnqueueOutcome conflict = queue.enqueue(command("cs_1", FulfilmentCompletionJobType.EXPIRED));

        assertEquals(EnqueueResult.CONFLICT, conflict.result());
        FulfilmentCompletionJob job = store.get(conflict.jobId()).orElseThrow();
        assertEquals(FulfilmentCompletionJobType.SUCCESS, job.getType());
        assertEquals(FulfilmentCompletionJobStatus.PENDING, job.getStatus());
    }

    @Test
    public void enqueueSanitizesSlashInPaymentRef() throws Exception {
        EnqueueOutcome outcome = queue.enqueue(new EnqueueCommand(
                "stripe", "cs/1", FulfilmentCompletionJobType.SUCCESS, null, null, null));

        assertEquals("stripe_cs_1", outcome.jobId());
        assertTrue(store.get("stripe_cs_1").isPresent());
    }

    @Test
    public void alreadyEnqueuedDoesNotResetSucceeded() throws Exception {
        queue.enqueue(command("cs_1", FulfilmentCompletionJobType.SUCCESS));
        FulfilmentCompletionWorker worker = new FulfilmentCompletionWorker(
                store, FulfilmentCompletionHandlerRegistry.noOp());
        worker.processJob(JobIds.of("stripe", "cs_1"));

        EnqueueOutcome second = queue.enqueue(command("cs_1", FulfilmentCompletionJobType.SUCCESS));
        assertEquals(EnqueueResult.ALREADY_ENQUEUED, second.result());
        assertEquals(FulfilmentCompletionJobStatus.SUCCEEDED, store.get(second.jobId()).orElseThrow().getStatus());
    }

    @Test
    public void processJobRunsHandlerOnce() throws Exception {
        List<String> handled = new ArrayList<>();
        FulfilmentCompletionHandlerRegistry registry = new FulfilmentCompletionHandlerRegistry(
                java.util.Map.of(FulfilmentCompletionJobType.SUCCESS, job -> handled.add(job.getId())));
        FulfilmentCompletionWorker worker = new FulfilmentCompletionWorker(store, registry);

        queue.enqueue(command("cs_1", FulfilmentCompletionJobType.SUCCESS));
        ProcessJobOutcome outcome = worker.processJob(JobIds.of("stripe", "cs_1"));

        assertEquals(ProcessJobResult.PROCESSED, outcome.result());
        assertEquals(FulfilmentCompletionJobStatus.SUCCEEDED, outcome.status());
        assertNull(outcome.lastError());
        assertEquals(List.of(JobIds.of("stripe", "cs_1")), handled);

        ProcessJobOutcome again = worker.processJob(JobIds.of("stripe", "cs_1"));
        assertEquals(ProcessJobResult.SKIPPED_NOT_DUE, again.result());
        assertEquals(1, handled.size());
    }

    private static EnqueueCommand command(String paymentRef, FulfilmentCompletionJobType type) {
        return new EnqueueCommand("stripe", paymentRef, type, "session-1", "entity-1", null);
    }
}
