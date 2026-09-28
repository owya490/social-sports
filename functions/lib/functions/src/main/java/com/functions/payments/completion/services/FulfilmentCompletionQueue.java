package com.functions.payments.completion.services;

import java.time.Clock;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.payments.completion.models.EnqueueCommand;
import com.functions.payments.completion.models.EnqueueOutcome;
import com.functions.payments.completion.models.EnqueueResult;
import com.functions.payments.completion.models.FulfilmentCompletionJob;
import com.functions.payments.completion.models.FulfilmentCompletionJobStatus;
import com.functions.payments.completion.models.FulfilmentCompletionJobType;
import com.functions.payments.completion.models.JobIds;
import com.functions.payments.completion.repositories.FulfilmentCompletionJobStore;
import com.google.cloud.Timestamp;

public class FulfilmentCompletionQueue {
    private static final Logger logger = LoggerFactory.getLogger(FulfilmentCompletionQueue.class);

    private final FulfilmentCompletionJobStore store;
    private final Clock clock;

    public FulfilmentCompletionQueue(FulfilmentCompletionJobStore store) {
        this(store, Clock.systemUTC());
    }

    public FulfilmentCompletionQueue(FulfilmentCompletionJobStore store, Clock clock) {
        this.store = store;
        this.clock = clock;
    }

    public EnqueueOutcome enqueue(EnqueueCommand command) throws Exception {
        FulfilmentCompletionJobType type = command.type() == null
                ? FulfilmentCompletionJobType.SUCCESS
                : command.type();
        String jobId = JobIds.of(command.provider(), command.paymentRef());
        Timestamp now = timestampNow();

        EnqueueOutcome outcome = store.runTransaction(access -> {
            Optional<FulfilmentCompletionJob> existing = access.get(jobId);
            if (existing.isEmpty()) {
                FulfilmentCompletionJob job = new FulfilmentCompletionJob();
                job.setId(jobId);
                job.setType(type);
                job.setStatus(FulfilmentCompletionJobStatus.PENDING);
                job.setProvider(command.provider().trim());
                job.setPaymentRef(command.paymentRef().trim());
                job.setFulfilmentSessionId(command.fulfilmentSessionId());
                job.setPaymentEntityId(command.paymentEntityId());
                job.setPayload(copyPayload(command.payload()));
                job.setAttemptCount(0);
                job.setLeaseUntil(now);
                job.setCreatedAt(now);
                job.setUpdatedAt(now);
                access.create(job);
                return new EnqueueOutcome(EnqueueResult.ENQUEUED, jobId);
            }

            FulfilmentCompletionJob current = existing.get();
            if (current.getType() == type) {
                return new EnqueueOutcome(EnqueueResult.ALREADY_ENQUEUED, jobId);
            }
            return new EnqueueOutcome(EnqueueResult.CONFLICT, jobId);
        });

        logger.info("Fulfilment completion enqueue result={} jobId={} type={}",
                outcome.result(), outcome.jobId(), type);
        return outcome;
    }

    private Timestamp timestampNow() {
        return Timestamp.of(Date.from(Instant.now(clock)));
    }

    private static Map<String, Object> copyPayload(Map<String, Object> payload) {
        if (payload == null) {
            return new HashMap<>();
        }
        return new HashMap<>(payload);
    }
}
