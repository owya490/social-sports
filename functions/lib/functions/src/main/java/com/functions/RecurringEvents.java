package com.functions;

import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.Transaction;

import com.google.protobuf.Timestamp;

import java.time.LocalDate;
import java.util.Map;

// import java.lang.Boolean;

// import org.apache.commons.logging.Log;
// import org.slf4j.Logger;

public class RecurringEvents {
    private static final String RECURRING_ACTIVE = "RecurringEvents/Active";

    public enum Frequency {
        WEEKLY(0),
        FORTNIGHTLY(1),
        MONTHLY(2);

        private final int value;

        Frequency(int value) {
            this.value = value;
        }

        public int getValue() {
            return value;
        }

        public static Frequency fromValue(int value) {
            for (Frequency freq : Frequency.values()) {
                if (freq.value == value) {
                    return freq;
                }
            }
            return null;
        }
    }

    public static void createEventsFromRecurrenceTemplates(LocalDate today, Transaction transaction) throws Exception {
        Firestore db = FirebaseService.getFirestore();
        final CollectionReference activeRecurringEventsRef = db.collection(RECURRING_ACTIVE);
        QuerySnapshot activeRecurringEventsSnapshot = transaction.get(activeRecurringEventsRef).get();
        for (DocumentSnapshot recurringEvent : activeRecurringEventsSnapshot.getDocuments()) {
            String recurringEventId = recurringEvent.getId();
            Map<String, Object> recurringEventDict = recurringEvent.getData();
            Map<String, Object> eventDataTemplate = (Map<String, Object>) recurringEventDict.get("eventDataTemplate");
            Map<String, Object> recurrenceData = (Map<String, Object>) recurringEventDict.get("recurrenceData");

            Frequency frequency = Frequency.fromValue(((Integer) recurrenceData.get("frequency")).intValue());
            Timestamp firstStartDate = (Timestamp) recurrenceData.get("firstStartDate");
            int recurrenceAmount = ((Integer) recurrenceData.get("recurrenceAmount")).intValue();
            int createDaysBefore = ((Integer) recurrenceData.get("createDaysBefore")).intValue();
            // boolean recurrenceEnabled = (Boolean)
            // recurrenceData.get("recurrenceEnabled");
            int currRecurrences = ((Integer) recurrenceData.get("currRecurrences")).intValue();
            LocalDate eventStartDate = TimeUtils
                    .convertTimestampToLocalDate((Timestamp) eventDataTemplate.get("startDate"));

            // Check if cron job needs to create event on this run through
            LocalDate targetCreationDate = eventStartDate
                    .minusDays(createDaysBefore);
            if (!today.isBefore(targetCreationDate)) {
                CreateEvents.createEvent(); // TODO: finish off stub function

                // Update the date of the next event in the eventDataTemplate.
                switch (frequency) {
                    case WEEKLY:
                        break;
                    case FORTNIGHTLY:
                        break;
                    case MONTHLY:
                        break;
                }
            }

            // Timestamp nextStartDate = (Timestamp) recurrenceData.get("nextStartDate");
            // Timestamp nextEndDate = (Timestamp) recurrenceData.get("nextEndDate");

        }
    }

    public static void createRecurringEventsCron() throws Exception {
        Firestore db = FirebaseService.getFirestore();
        LocalDate today = LocalDate.now();
        // TODO: set up logging
        db.runTransaction(t -> {
            createEventsFromRecurrenceTemplates(today, t);
            return null;
        });
    }
}
