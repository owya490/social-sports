package com.functions.RecurringEvents;

import com.functions.FirebaseService;
import com.functions.JavaUtils;
import com.functions.TimeUtils;
import com.functions.Events.Events;
import com.functions.Events.NewEventData;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;

import com.google.protobuf.Timestamp;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class RecurringEvents {
    private static final String RECURRING_ACTIVE = "RecurringEvents/Active";
    private static final String RECURRING_INACTIVE = "RecurringEvents/InActive";

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

    public static void createEventsFromRecurrenceTemplates(LocalDate today) throws Exception {
        Firestore db = FirebaseService.getFirestore();

        final CollectionReference activeRecurringEventsRef = db.collection(RECURRING_ACTIVE);
        List<String> moveToInactiveRecurringEvents = new ArrayList<String>();
        for (DocumentSnapshot recurringEventSnapshot : activeRecurringEventsRef.get().get().getDocuments()) {
            db.runTransaction((Transaction.Function<Void>) transaction -> {
                RecurringEvent recurringEvent = recurringEventSnapshot.toObject(RecurringEvent.class);
                if (recurringEvent == null) {
                    // TODO: throw error
                    return null;
                }
                NewEventData newEventData = recurringEvent.getEventData();
                RecurrenceData recurrenceData = recurringEvent.getRecurrenceData();
                Map<Timestamp, String> pastRecurrences = recurrenceData.getPastRecurrences();

                Boolean isStillActiveRecurrenceFlag = false;
                for (Timestamp recurrenceTimestamp : recurrenceData.getAllRecurrences()) {
                    LocalDate eventCreationDate = TimeUtils.convertTimestampToLocalDate(recurrenceTimestamp)
                            .minusDays(recurrenceData.getCreateDaysBefore());
                    if (!pastRecurrences.containsKey(recurrenceTimestamp)
                            && (today.isAfter(eventCreationDate) || today.equals(eventCreationDate))) {
                        isStillActiveRecurrenceFlag = true;
                        String newEventId = Events.createEventInternal(newEventData, transaction);
                        pastRecurrences.put(recurrenceTimestamp, newEventId);
                    }
                }

                recurrenceData.setPastRecurrences(pastRecurrences);
                recurringEvent.setRecurrenceData(recurrenceData);
                transaction.update(recurringEventSnapshot.getReference(),
                        JavaUtils.toMap(recurringEvent));

                if (!isStillActiveRecurrenceFlag) {
                    moveToInactiveRecurringEvents.add(recurringEventSnapshot.getId());
                }
                return null;
            });
        }

        for (String recurringEventId : moveToInactiveRecurringEvents) {
            db.runTransaction(transaction -> {
                RecurringEvents.moveRecurringEventToInactive(recurringEventId, transaction);
                return null;
            });

        }
    }

    public static void createRecurringEventsCron() throws Exception {
        LocalDate today = LocalDate.now();
        // TODO: set up logging
        createEventsFromRecurrenceTemplates(today);
    }
}
