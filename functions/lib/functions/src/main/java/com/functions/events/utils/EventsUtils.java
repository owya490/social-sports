package com.functions.events.utils;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventData;
import com.functions.firebase.services.FirebaseService.CollectionPaths;
import com.functions.stripe.exceptions.CheckoutDateTimeException;
import com.functions.users.models.PrivateUserData;
import com.functions.users.models.PublicUserData;
import com.functions.users.services.Users;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;

public class EventsUtils {
    private static final Logger logger = LoggerFactory.getLogger(EventsUtils.class);
    public static List<String> tokenizeText(String text) {
        return Arrays.stream(text.toLowerCase().split("\\s+")).filter(token -> !token.isEmpty())
                .collect(Collectors.toList());
    }

    public static void addEventIdToUserOrganiserPublicUpcomingEvents(String userId, String eventId)
            throws Exception {
        PublicUserData publicUserData = Users.getPublicUserDataById(userId);

        List<String> publicUpcomingOrganiserEvents =
                publicUserData.getPublicUpcomingOrganiserEvents();
        publicUpcomingOrganiserEvents.add(eventId);
        publicUserData.setPublicUpcomingOrganiserEvents(publicUpcomingOrganiserEvents);

        Users.updatePublicUserData(userId, publicUserData);
    }

    public static void addEventIdToUserOrganiserEvents(String userId, String eventId)
            throws Exception {
        PrivateUserData privateUserData = Users.getPrivateUserDataById(userId);

        List<String> organiserEvents = privateUserData.getOrganiserEvents();
        organiserEvents.add(eventId);
        privateUserData.setOrganiserEvents(organiserEvents);

        Users.updatePrivateUserData(userId, privateUserData);
    }

    /**
     * Fetches organiser ID for an event.
     */
    public static String extractOrganiserIdForEvent(EventData event) {
        String eventId = event.getEventId();
        try {
            if (event == null || event.getOrganiserId() == null || event.getOrganiserId().isEmpty()) {
                logger.error("Event " + eventId + " missing organiserId");
                throw new RuntimeException("Event " + eventId + " missing organiserId");
            }

            return event.getOrganiserId();
        } catch (Exception e) {
            logger.error("Failed to fetch organiser ID for event {}: {}", eventId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch organiser ID for event " + eventId, e);
        }
    }

    /**
     * Validates event timing: not paused, not concluded, registration still open.
     */
    public static void validateEventTiming(EventData event, String eventId) {
        Boolean paused = event.getPaused() != null ? event.getPaused() : false;
        Timestamp endDate = event.getEndDate();
        Timestamp registrationDeadline = event.getRegistrationDeadline();

        if (endDate == null || registrationDeadline == null) {
            logger.error("Event " + eventId + " missing date fields");
            throw new RuntimeException("Event " + eventId + " missing date fields");
        }

        Instant now = Instant.now();
        Instant eventEnd = Instant.ofEpochSecond(endDate.getSeconds(), endDate.getNanos());
        Instant registrationEnd = Instant.ofEpochSecond(registrationDeadline.getSeconds(), registrationDeadline.getNanos());

        if (paused || now.isAfter(eventEnd) || now.isAfter(registrationEnd)) {
            throw new CheckoutDateTimeException("Event " + eventId + " not available: " +
                    "paused=" + paused + ", concluded=" + now.isAfter(eventEnd) + 
                    ", registrationClosed=" + now.isAfter(registrationEnd));
        }
    }

    /**
     * Builds event document reference.
     */
    public static DocumentReference getEventRef(Firestore db, String eventId, Boolean isPrivate) {
        String privacyPath = Boolean.TRUE.equals(isPrivate) ? CollectionPaths.PRIVATE : CollectionPaths.PUBLIC;
        return db.collection(CollectionPaths.EVENTS + "/" + CollectionPaths.ACTIVE + "/" + privacyPath)
                .document(eventId);
    }
}
