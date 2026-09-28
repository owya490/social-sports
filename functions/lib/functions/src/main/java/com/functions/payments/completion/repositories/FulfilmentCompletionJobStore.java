package com.functions.payments.completion.repositories;

import java.util.List;
import java.util.Optional;

import com.functions.payments.completion.models.FulfilmentCompletionJob;
import com.google.cloud.Timestamp;

public interface FulfilmentCompletionJobStore {
    @FunctionalInterface
    interface TransactionWork<T> {
        T apply(TransactionalJobAccess access) throws Exception;
    }

    interface TransactionalJobAccess {
        Optional<FulfilmentCompletionJob> get(String jobId) throws Exception;

        void create(FulfilmentCompletionJob job) throws Exception;

        void update(FulfilmentCompletionJob job) throws Exception;
    }

    <T> T runTransaction(TransactionWork<T> work) throws Exception;

    Optional<FulfilmentCompletionJob> get(String jobId) throws Exception;

    List<FulfilmentCompletionJob> listDue(Timestamp now, int limit) throws Exception;
}
