package com.functions.RecurringEvents;

import com.functions.FirebaseService;
import com.functions.JavaUtils;
import com.functions.TimeUtils;
import com.functions.Events.Events;
import com.functions.Events.NewEventData;
import com.functions.FirebaseService.CollectionPaths;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.Transaction;

import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

import com.google.protobuf.Timestamp;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class RecurringEvents implements HttpFunction {

    public static void moveRecurringEventToInactive(String recurrenceId, Transaction transaction) throws Exception {
        Firestore db = FirebaseService.getFirestore();
        DocumentReference oldInactivePrivateRecurringEventsRef = db.collection(CollectionPaths.RECURRING_EVENTS)
                .document(CollectionPaths.ACTIVE).collection(CollectionPaths.PRIVATE).document(recurrenceId);
        DocumentReference oldInactivePublicRecurringEventsRef = db.collection(CollectionPaths.RECURRING_EVENTS)
                .document(CollectionPaths.ACTIVE).collection(CollectionPaths.PUBLIC).document(recurrenceId);

        if (oldInactivePrivateRecurringEventsRef.get().get().exists()) {
            Map<String, Object> inactiveRecurringEventDict = transaction.get(oldInactivePrivateRecurringEventsRef).get()
                    .getData();
            if (inactiveRecurringEventDict == null) {
                throw new Exception("Recurring event dictionary not able to be retrieved: " + recurrenceId);
            }
            DocumentReference newInactiveRecurringEventsRef = db.collection(CollectionPaths.RECURRING_EVENTS)
                    .document(CollectionPaths.INACTIVE).collection(CollectionPaths.PRIVATE).document(recurrenceId);
            transaction.delete(oldInactivePrivateRecurringEventsRef);
            transaction.set(newInactiveRecurringEventsRef, inactiveRecurringEventDict);
        } else if (oldInactivePublicRecurringEventsRef.get().get().exists()) {
            Map<String, Object> inactiveRecurringEventDict = transaction.get(oldInactivePublicRecurringEventsRef).get()
                    .getData();
            if (inactiveRecurringEventDict == null) {
                throw new Exception("Recurring event dictionary not able to be retrieved: " + recurrenceId);
            }
            DocumentReference newInactiveRecurringEventsRef = db.collection(CollectionPaths.RECURRING_EVENTS)
                    .document(CollectionPaths.INACTIVE).collection(CollectionPaths.PUBLIC).document(recurrenceId);
            transaction.delete(oldInactivePublicRecurringEventsRef);
            transaction.set(newInactiveRecurringEventsRef, inactiveRecurringEventDict);
        }

        throw new Exception("Recurring event not found for ID: " + recurrenceId);
    }

    public static void createEventsFromRecurrenceTemplates(LocalDate today) throws Exception {
        Firestore db = FirebaseService.getFirestore();

        final CollectionReference activePrivateRecurringEventsRef = db.collection(CollectionPaths.RECURRING_EVENTS)
                .document(CollectionPaths.ACTIVE).collection(CollectionPaths.PRIVATE);
        final CollectionReference activePublicRecurringEventsRef = db.collection(CollectionPaths.RECURRING_EVENTS)
                .document(CollectionPaths.ACTIVE).collection(CollectionPaths.PUBLIC);
        List<QueryDocumentSnapshot> recurringEventSnapshots = new ArrayList<QueryDocumentSnapshot>();
        recurringEventSnapshots.addAll(activePrivateRecurringEventsRef.get().get()
                .getDocuments());
        recurringEventSnapshots.addAll(activePublicRecurringEventsRef.get().get().getDocuments());

        List<String> moveToInactiveRecurringEvents = new ArrayList<String>();

        for (DocumentSnapshot recurringEventSnapshot : recurringEventSnapshots) {
            db.runTransaction((Transaction.Function<Void>) transaction -> {
                RecurringEvent recurringEvent = recurringEventSnapshot.toObject(RecurringEvent.class);
                if (recurringEvent == null) {
                    throw new Exception(
                            "Could not turn recurringEventSnapshot object into RecurringEvent pojo using toObject: "
                                    + recurringEventSnapshot.getId());
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

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        response.appendHeader("Access-Control-Allow-Origin", "https://www.sportshub.net.au");
        response.appendHeader("Access-Control-Allow-Origin", "*");
        response.appendHeader("Access-Control-Allow-Methods", "GET");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type");

        if (!"GET".equalsIgnoreCase(request.getMethod())) {
            response.setStatusCode(405); // Method Not Allowed
            response.appendHeader("Allow", "GET"); // Inform client that only GET is allowed
            response.getWriter().write("This function only supports GET requests.");
            return;
        }

        LocalDate today = LocalDate.now();
        // TODO: put in logging
        createEventsFromRecurrenceTemplates(today);

        response.getWriter().write("Recurring events processed for: " + today);
    }
}
