package com.functions.payments.completion.repositories;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.functions.payments.completion.models.FulfilmentCompletionJob;
import com.functions.payments.completion.models.FulfilmentCompletionJobStatus;
import com.functions.utils.JavaUtils;
import com.google.cloud.Timestamp;

public class InMemoryFulfilmentCompletionJobStore implements FulfilmentCompletionJobStore {
    private final Map<String, FulfilmentCompletionJob> jobs = new LinkedHashMap<>();
    private final Object lock = new Object();

    @Override
    public <T> T runTransaction(TransactionWork<T> work) throws Exception {
        synchronized (lock) {
            return work.apply(new MemoryAccess());
        }
    }

    @Override
    public Optional<FulfilmentCompletionJob> get(String jobId) {
        synchronized (lock) {
            return Optional.ofNullable(jobs.get(jobId)).map(InMemoryFulfilmentCompletionJobStore::copy);
        }
    }

    @Override
    public List<FulfilmentCompletionJob> listDue(Timestamp now, int limit) {
        synchronized (lock) {
            List<FulfilmentCompletionJob> due = new ArrayList<>();
            jobs.values().stream()
                    .filter(job -> job.getLeaseUntil() != null && job.getLeaseUntil().compareTo(now) <= 0)
                    .filter(job -> job.getStatus() != FulfilmentCompletionJobStatus.SUCCEEDED
                            && job.getStatus() != FulfilmentCompletionJobStatus.POISON)
                    .sorted(Comparator.comparing(FulfilmentCompletionJob::getLeaseUntil))
                    .limit(limit)
                    .forEach(job -> due.add(copy(job)));
            return due;
        }
    }

    private class MemoryAccess implements TransactionalJobAccess {
        @Override
        public Optional<FulfilmentCompletionJob> get(String jobId) {
            return Optional.ofNullable(jobs.get(jobId)).map(InMemoryFulfilmentCompletionJobStore::copy);
        }

        @Override
        public void create(FulfilmentCompletionJob job) {
            if (jobs.containsKey(job.getId())) {
                throw new IllegalStateException("Job already exists: " + job.getId());
            }
            jobs.put(job.getId(), copy(job));
        }

        @Override
        public void update(FulfilmentCompletionJob job) {
            if (!jobs.containsKey(job.getId())) {
                throw new IllegalStateException("Job does not exist: " + job.getId());
            }
            jobs.put(job.getId(), copy(job));
        }
    }

    private static FulfilmentCompletionJob copy(FulfilmentCompletionJob job) {
        return JavaUtils.deepCopy(job, FulfilmentCompletionJob.class);
    }
}
