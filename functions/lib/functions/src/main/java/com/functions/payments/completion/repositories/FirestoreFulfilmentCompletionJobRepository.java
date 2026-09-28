package com.functions.payments.completion.repositories;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.firebase.services.FirebaseService;
import com.functions.payments.completion.models.FulfilmentCompletionJob;
import com.functions.payments.completion.models.FulfilmentCompletionJobStatus;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.Transaction;

public class FirestoreFulfilmentCompletionJobRepository implements FulfilmentCompletionJobStore {
    private static final Logger logger = LoggerFactory.getLogger(FirestoreFulfilmentCompletionJobRepository.class);

    private DocumentReference docRef(String jobId) {
        Firestore db = FirebaseService.getFirestore();
        return db.collection(FirebaseService.CollectionPaths.FULFILMENT_COMPLETION_JOBS).document(jobId);
    }

    @Override
    public <T> T runTransaction(TransactionWork<T> work) throws Exception {
        return FirebaseService.createFirestoreTransaction(transaction -> work.apply(new FirestoreAccess(transaction)));
    }

    @Override
    public Optional<FulfilmentCompletionJob> get(String jobId) throws Exception {
        DocumentSnapshot snapshot = docRef(jobId).get().get();
        return fromSnapshot(snapshot);
    }

    @Override
    public List<FulfilmentCompletionJob> listDue(Timestamp now, int limit) throws Exception {
        Firestore db = FirebaseService.getFirestore();
        QuerySnapshot snapshot = db.collection(FirebaseService.CollectionPaths.FULFILMENT_COMPLETION_JOBS)
                .whereLessThanOrEqualTo("leaseUntil", now)
                .orderBy("leaseUntil")
                .limit(limit)
                .get()
                .get();

        List<FulfilmentCompletionJob> due = new ArrayList<>();
        for (QueryDocumentSnapshot document : snapshot.getDocuments()) {
            Optional<FulfilmentCompletionJob> job = fromSnapshot(document);
            if (job.isEmpty()) {
                continue;
            }
            FulfilmentCompletionJobStatus status = job.get().getStatus();
            if (status == FulfilmentCompletionJobStatus.SUCCEEDED || status == FulfilmentCompletionJobStatus.POISON) {
                continue;
            }
            due.add(job.get());
        }
        return due;
    }

    private static Optional<FulfilmentCompletionJob> fromSnapshot(DocumentSnapshot snapshot) {
        if (snapshot == null || !snapshot.exists()) {
            return Optional.empty();
        }
        FulfilmentCompletionJob job = snapshot.toObject(FulfilmentCompletionJob.class);
        if (job == null) {
            logger.error("Failed to map FulfilmentCompletionJob snapshot id={}", snapshot.getId());
            throw new IllegalStateException("Failed to map FulfilmentCompletionJob " + snapshot.getId());
        }
        job.setId(snapshot.getId());
        return Optional.of(job);
    }

    private class FirestoreAccess implements TransactionalJobAccess {
        private final Transaction transaction;

        private FirestoreAccess(Transaction transaction) {
            this.transaction = transaction;
        }

        @Override
        public Optional<FulfilmentCompletionJob> get(String jobId) throws Exception {
            DocumentSnapshot snapshot = transaction.get(docRef(jobId)).get();
            return fromSnapshot(snapshot);
        }

        @Override
        public void create(FulfilmentCompletionJob job) {
            transaction.create(docRef(job.getId()), job);
        }

        @Override
        public void update(FulfilmentCompletionJob job) {
            transaction.set(docRef(job.getId()), job);
        }
    }
}
