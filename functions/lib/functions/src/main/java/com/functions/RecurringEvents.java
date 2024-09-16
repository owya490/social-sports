package com.functions;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;


import java.time.LocalDate;

import org.apache.commons.logging.Log;
import org.slf4j.Logger;



public class RecurringEvents {
    private static final String RECURRING_ACTIVE = "RecurringEvents/Active";
    public enum Frequency {
        WEEKLY,
        FORTNIGHTLY,
        MONTHLY
    }

    public static void createEventsFromRecurrenceTemplates(LocalDate today, Logger logger, Transaction transaction) throws Exception {
        Firestore db = FirebaseService.getFirestore();
        db.runTransaction(new Transaction.Function<Void>() {
            @Override
            public Void apply(@NonNull Transaction transaction) throws FirebaseFirestoreException {

            }
        }).addOnSuccessListener(new OnSuccessListener<Void>() {
            @Override
            public void onSuccess(Void aVoid) {
                Log.d(TAG, "Transaction success!");
            }
        })
        .addOnFailureListener(new OnFailureListener() {
            @Override
            public void onFailure(@NonNull Exception e) {
                Log.w(TAG, "Transaction failure.", e);
            }
        });
    }

    public static void createRecurringEventsCron() throws Exception {
        Firestore db = FirebaseService.getFirestore();
        LocalDate today = LocalDate.now();
        Logger logger = new Logger();
        db.runTransaction(t -> {
            createEventsFromRecurrenceTemplates(today, logger, t);
            return null;
        });
    }
}
