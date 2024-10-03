package com.functions;

import com.functions.Events.AbstractEventData;
import com.functions.Events.Events;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
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
    private static final String RECURRING_INACTIVE = "RecurringEvents/InActive";

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

    public static void moveRecurringEventToInactive(String recurrenceId, Transaction transaction) throws Exception {
        Firestore db = FirebaseService.getFirestore();
        final DocumentReference oldInactiveRecurringEventsRef = db.collection(RECURRING_ACTIVE).document(recurrenceId);
        Map<String, Object> inactiveRecurringEventDict = transaction.get(oldInactiveRecurringEventsRef).get().getData();
        if (inactiveRecurringEventDict == null) {
            throw new Exception("Recurring event not found for ID: " + recurrenceId);
        }
        final DocumentReference newInactiveRecurringEventsRef = db.collection(RECURRING_INACTIVE)
                .document(recurrenceId);
        transaction.set(newInactiveRecurringEventsRef, inactiveRecurringEventDict);
    }

    public static void createEventsFromRecurrenceTemplates(LocalDate today, Transaction transaction) throws Exception {
        Firestore db = FirebaseService.getFirestore();
        final CollectionReference activeRecurringEventsRef = db.collection(RECURRING_ACTIVE);
        QuerySnapshot activeRecurringEventsSnapshot = transaction.get(activeRecurringEventsRef).get();
        for (DocumentSnapshot recurringEvent : activeRecurringEventsSnapshot.getDocuments()) {
            String recurringEventId = recurringEvent.getId();
            Map<String, Object> recurringEventDict = recurringEvent.getData();
            Map<String, Object> eventDataTemplate = (Map<String, Object>) recurringEventDict.get("eventDataTemplate");
            // deserialize
            // AbstractEventData eventData =
            // recurringEvent.toObject(AbstractEventData.class); into
            // a
            // record

            /**
             * public record EventData(String eventId, Instant startDate);
             * 
             * ObjectMapper mapper = new ObjectMapper();
             * mapper.readValue(jsonString)
             * 
             */
            Map<String, Object> recurrenceData = (Map<String, Object>) recurringEventDict.get("recurrenceData");

            Frequency frequency = Frequency.fromValue(((Integer) recurrenceData.get("frequency")).intValue());
            Timestamp firstStartDate = (Timestamp) recurrenceData.get("firstStartDate");
            int recurrenceAmount = ((Integer) recurrenceData.get("recurrenceAmount")).intValue();
            int createDaysBefore = ((Integer) recurrenceData.get("createDaysBefore")).intValue();
            int currRecurrences = ((Integer) recurrenceData.get("currRecurrences")).intValue();
            LocalDate eventStartDate = TimeUtils
                    .convertTimestampToLocalDate((Timestamp) eventDataTemplate.get("startDate"));

            // Check if cron job needs to create event on this run through
            LocalDate targetCreationDate = eventStartDate
                    .minusDays(createDaysBefore);
            if (!today.isBefore(targetCreationDate) && currRecurrences < recurrenceAmount) {
                // Events.createEvent(transaction); // TODO: finish off stub function
                currRecurrences += 1;

                // Update the date of the next event in the eventDataTemplate.
                switch (frequency) {
                    case WEEKLY:
                        eventDataTemplate.put("startDate",
                                TimeUtils.convertLocalDateToTimestamp(eventStartDate.plusDays(7)));
                        break;
                    case FORTNIGHTLY:
                        eventDataTemplate.put("startDate",
                                TimeUtils.convertLocalDateToTimestamp(eventStartDate.plusDays(14)));
                        break;
                    case MONTHLY:
                        eventDataTemplate.put("startDate",
                                TimeUtils.convertLocalDateToTimestamp(eventStartDate.plusMonths(1)));
                        break;
                }
            }

            // Move recurring event to expired if it has reached target recurrence amount.
            if (currRecurrences >= recurrenceAmount) {
                RecurringEvents.moveRecurringEventToInactive(recurringEventId, transaction);
            }
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
