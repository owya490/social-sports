package com.functions.events.services;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.Transaction;

public class MoveInactiveEventsService {
    static final String ACTIVE_PUBLIC = "Events/Active/Public";
    static final String ACTIVE_PRIVATE = "Events/Active/Private";
    static final String INACTIVE_PUBLIC = "Events/InActive/Public";
    static final String INACTIVE_PRIVATE = "Events/InActive/Private";
    private static final String PUBLIC_ORGANISERS = "Users/Active/Public";
    private static final String UPCOMING_EVENTS = "publicUpcomingOrganiserEvents";
    private static final ZoneId SYDNEY_TIMEZONE = ZoneId.of("Australia/Sydney");
    private static final DateTimeFormatter DAY_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final Logger logger = LoggerFactory.getLogger(MoveInactiveEventsService.class);

    private MoveInactiveEventsService() {
    }

    public static LocalDate sydneyDate(Instant now) {
        return now.atZone(SYDNEY_TIMEZONE).toLocalDate();
    }

    public static String moveInactiveEvents(Firestore db, LocalDate today) throws Exception {
        logger.info("Moving inactive events for date {}", today.format(DAY_FORMAT));
        archiveCollection(db, today, ACTIVE_PUBLIC, INACTIVE_PUBLIC);
        archiveCollection(db, today, ACTIVE_PRIVATE, INACTIVE_PRIVATE);
        return "Moved all Public and Private Active Events which are past their end date to Inactive.";
    }

    static void archiveCollection(Firestore db, LocalDate today, String activePath, String inactivePath)
            throws Exception {
        QuerySnapshot activeEvents = db.collection(activePath).get().get();
        for (QueryDocumentSnapshot event : activeEvents.getDocuments()) {
            try {
                // The collection read can be stale by the time this event is archived.
                if (!hasEnded(event.getData(), today)) {
                    continue;
                }
                DocumentReference source = event.getReference();
                DocumentReference destination = db.collection(inactivePath).document(event.getId());
                boolean moved = runTransaction(db,
                        transaction -> moveEvent(db, transaction, source, destination, today));
                if (moved) {
                    logger.info("Archived event {} from {}", event.getId(), activePath);
                }
            } catch (EventArchivalException error) {
                logger.error("Could not archive event {}: {}", event.getId(), error.getMessage());
            }
        }
    }

    static boolean hasEnded(Map<String, Object> eventData, LocalDate today) {
        if (eventData == null) {
            throw new EventArchivalException("endDate must be a timezone-aware timestamp");
        }
        Object endDate = eventData.get("endDate");
        if (!(endDate instanceof Timestamp timestamp)) {
            throw new EventArchivalException("endDate must be a timezone-aware timestamp");
        }
        LocalDate endDay = timestamp.toSqlTimestamp().toInstant().atZone(SYDNEY_TIMEZONE).toLocalDate();
        return endDay.isBefore(today);
    }

    static boolean moveEventInTransaction(Firestore db, DocumentReference source, DocumentReference destination,
            LocalDate today) throws Exception {
        return runTransaction(db, transaction -> moveEvent(db, transaction, source, destination, today));
    }

    private static boolean moveEvent(Firestore db, Transaction transaction, DocumentReference source,
            DocumentReference destination, LocalDate today) throws Exception {
        DocumentSnapshot eventSnapshot = transaction.get(source).get();
        if (!eventSnapshot.exists()) {
            return false;
        }
        Map<String, Object> eventData = eventSnapshot.getData();
        if (!hasEnded(eventData, today)) {
            return false;
        }
        if (transaction.get(destination).get().exists()) {
            throw new EventArchivalException("inactive event already exists");
        }

        boolean isPublic = ACTIVE_PUBLIC.equals(source.getParent().getPath());
        DocumentReference publicRef = null;
        DocumentSnapshot publicSnapshot = null;
        if (isPublic) {
            publicRef = publicOrganiser(db, eventData);
            publicSnapshot = transaction.get(publicRef).get();
            if (publicSnapshot.exists()) {
                validateUpcomingEvents(publicSnapshot);
            }
        }

        // Copy the stored document so fields this service does not know about survive archival.
        Map<String, Object> archived = new HashMap<>(eventData);
        archived.put("isActive", false);
        transaction.create(destination, archived);
        transaction.delete(source);
        if (isPublic && publicSnapshot.exists()) {
            transaction.update(publicRef, UPCOMING_EVENTS, FieldValue.arrayRemove(source.getId()));
        }
        return true;
    }

    private static DocumentReference publicOrganiser(Firestore db, Map<String, Object> eventData) {
        Object organiserId = eventData.get("organiserId");
        if (!(organiserId instanceof String organiser) || organiser.isBlank() || organiser.indexOf('/') >= 0) {
            throw new EventArchivalException("organiserId must identify one organiser");
        }
        return db.collection(PUBLIC_ORGANISERS).document(organiser);
    }

    private static void validateUpcomingEvents(DocumentSnapshot publicSnapshot) {
        Map<String, Object> data = publicSnapshot.getData();
        Object upcoming = List.of();
        if (data != null && data.containsKey(UPCOMING_EVENTS)) {
            upcoming = data.get(UPCOMING_EVENTS);
        }
        if (!(upcoming instanceof List<?> events) || events.stream().anyMatch(eventId -> !(eventId instanceof String))) {
            throw new EventArchivalException("publicUpcomingOrganiserEvents must be an ID list");
        }
    }

    private static <T> T runTransaction(Firestore db, Transaction.Function<T> function) throws Exception {
        try {
            return db.runTransaction(function).get();
        } catch (ExecutionException failure) {
            Throwable cause = failure.getCause();
            if (cause instanceof Exception exception) {
                throw exception;
            }
            throw failure;
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            throw interrupted;
        }
    }
}
