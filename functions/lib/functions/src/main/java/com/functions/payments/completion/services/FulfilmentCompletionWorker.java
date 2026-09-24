package com.functions.payments.completion.services;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.payments.completion.handlers.FulfilmentCompletionHandlerRegistry;
import com.functions.payments.completion.models.FulfilmentCompletionJob;
import com.functions.payments.completion.models.FulfilmentCompletionJobStatus;
import com.functions.payments.completion.models.ProcessDueSummary;
import com.functions.payments.completion.models.ProcessJobOutcome;
import com.functions.payments.completion.models.ProcessJobResult;
import com.functions.payments.completion.repositories.FulfilmentCompletionJobStore;
import com.google.cloud.Timestamp;

public class FulfilmentCompletionWorker {
    private static final Logger logger = LoggerFactory.getLogger(FulfilmentCompletionWorker.class);

    public static final int MAX_ATTEMPTS = 5;
    public static final int LEASE_SECONDS = 60;
    public static final int BACKOFF_SECONDS = 30;
    public static final int DEFAULT_PROCESS_LIMIT = 20;

    /** Drop terminal jobs out of the leaseUntil < now due query without a composite index. */
    static final Timestamp TERMINAL_LEASE = Timestamp.parseTimestamp("2100-01-01T00:00:00Z");

    private final FulfilmentCompletionJobStore store;
    private final FulfilmentCompletionHandlerRegistry handlers;
    private final Clock clock;

    public FulfilmentCompletionWorker(
            FulfilmentCompletionJobStore store,
            FulfilmentCompletionHandlerRegistry handlers) {
        this(store, handlers, Clock.systemUTC());
    }

    public FulfilmentCompletionWorker(
            FulfilmentCompletionJobStore store,
            FulfilmentCompletionHandlerRegistry handlers,
            Clock clock) {
        this.store = store;
        this.handlers = handlers;
        this.clock = clock;
    }

    public ProcessDueSummary processDueJobs(int limit) throws Exception {
        Timestamp now = timestampNow();
        List<FulfilmentCompletionJob> due = store.listDue(now, limit);
        List<ProcessJobOutcome> outcomes = new ArrayList<>();
        int processed = 0;
        int skipped = 0;
        int failed = 0;
        for (FulfilmentCompletionJob job : due) {
            ProcessJobOutcome outcome = processJob(job.getId());
            outcomes.add(outcome);
            if (outcome.result() == ProcessJobResult.PROCESSED) {
                processed++;
            } else if (outcome.result() == ProcessJobResult.HANDLER_FAILED) {
                failed++;
            } else {
                skipped++;
            }
        }
        logger.info("Fulfilment completion due-job sweep processed={} skipped={} failed={}",
                processed, skipped, failed);
        return new ProcessDueSummary(processed, skipped, failed, outcomes);
    }

    public ProcessJobOutcome processJob(String jobId) throws Exception {
        Optional<FulfilmentCompletionJob> claimed = claim(jobId);
        if (claimed.isEmpty()) {
            Optional<FulfilmentCompletionJob> current = store.get(jobId);
            if (current.isEmpty()) {
                logger.info("Fulfilment completion process result={} jobId={}", ProcessJobResult.NOT_FOUND, jobId);
                return new ProcessJobOutcome(ProcessJobResult.NOT_FOUND, jobId, null, null);
            }
            logger.info("Fulfilment completion process result={} jobId={} status={}",
                    ProcessJobResult.SKIPPED_NOT_DUE, jobId, current.get().getStatus());
            return new ProcessJobOutcome(
                    ProcessJobResult.SKIPPED_NOT_DUE, jobId, current.get().getStatus(), current.get().getLastError());
        }

        FulfilmentCompletionJob job = claimed.get();
        try {
            handlers.require(job.getType()).handle(job);
            FulfilmentCompletionJob succeeded = markTerminal(job, FulfilmentCompletionJobStatus.SUCCEEDED, null);
            logger.info("Fulfilment completion process result={} jobId={} type={} status={}",
                    ProcessJobResult.PROCESSED, jobId, job.getType(), succeeded.getStatus());
            return new ProcessJobOutcome(ProcessJobResult.PROCESSED, jobId, succeeded.getStatus(), null);
        } catch (Exception e) {
            FulfilmentCompletionJob failed = markFailed(job, e);
            logger.warn("Fulfilment completion handler failed jobId={} type={} attemptCount={} status={}",
                    jobId, job.getType(), failed.getAttemptCount(), failed.getStatus(), e);
            return new ProcessJobOutcome(
                    ProcessJobResult.HANDLER_FAILED, jobId, failed.getStatus(), failed.getLastError());
        }
    }

    private Optional<FulfilmentCompletionJob> claim(String jobId) throws Exception {
        Timestamp now = timestampNow();
        return store.runTransaction(access -> {
            Optional<FulfilmentCompletionJob> existing = access.get(jobId);
            if (existing.isEmpty()) {
                return Optional.empty();
            }
            FulfilmentCompletionJob job = existing.get();
            if (!isLeasable(job, now)) {
                return Optional.empty();
            }
            job.setStatus(FulfilmentCompletionJobStatus.RUNNING);
            job.setAttemptCount(job.getAttemptCount() + 1);
            job.setLeaseUntil(timestampAfter(LEASE_SECONDS));
            job.setUpdatedAt(now);
            access.update(job);
            return Optional.of(job);
        });
    }

    private FulfilmentCompletionJob markTerminal(
            FulfilmentCompletionJob claimed,
            FulfilmentCompletionJobStatus status,
            String lastError) throws Exception {
        Timestamp now = timestampNow();
        return store.runTransaction(access -> {
            FulfilmentCompletionJob job = access.get(claimed.getId())
                    .orElseThrow(() -> new IllegalStateException("Job disappeared after claim: " + claimed.getId()));
            job.setStatus(status);
            job.setLastError(lastError);
            job.setLeaseUntil(TERMINAL_LEASE);
            job.setUpdatedAt(now);
            access.update(job);
            return job;
        });
    }

    private FulfilmentCompletionJob markFailed(FulfilmentCompletionJob claimed, Exception error) throws Exception {
        if (claimed.getAttemptCount() >= MAX_ATTEMPTS) {
            return markTerminal(claimed, FulfilmentCompletionJobStatus.POISON, message(error));
        }
        Timestamp now = timestampNow();
        int backoffSeconds = BACKOFF_SECONDS * claimed.getAttemptCount();
        return store.runTransaction(access -> {
            FulfilmentCompletionJob job = access.get(claimed.getId())
                    .orElseThrow(() -> new IllegalStateException("Job disappeared after claim: " + claimed.getId()));
            job.setStatus(FulfilmentCompletionJobStatus.FAILED);
            job.setLastError(message(error));
            job.setLeaseUntil(timestampAfter(backoffSeconds));
            job.setUpdatedAt(now);
            access.update(job);
            return job;
        });
    }

    static boolean isLeasable(FulfilmentCompletionJob job, Timestamp now) {
        FulfilmentCompletionJobStatus status = job.getStatus();
        if (status == FulfilmentCompletionJobStatus.SUCCEEDED || status == FulfilmentCompletionJobStatus.POISON) {
            return false;
        }
        if (status != FulfilmentCompletionJobStatus.PENDING
                && status != FulfilmentCompletionJobStatus.FAILED
                && status != FulfilmentCompletionJobStatus.RUNNING) {
            return false;
        }
        return job.getLeaseUntil() != null && job.getLeaseUntil().compareTo(now) <= 0;
    }

    private Timestamp timestampNow() {
        return Timestamp.of(Date.from(Instant.now(clock)));
    }

    private Timestamp timestampAfter(int seconds) {
        return Timestamp.of(Date.from(Instant.now(clock).plusSeconds(seconds)));
    }

    private static String message(Exception error) {
        String message = error.getMessage();
        if (message == null || message.isBlank()) {
            return error.getClass().getSimpleName();
        }
        return message;
    }
}
