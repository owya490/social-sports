package com.functions.global.services;

import com.functions.events.models.EventData;
import com.functions.events.repositories.EventsRepository;
import com.functions.global.exceptions.AuthorizationException;

public final class EventAuthorizationService {
    private EventAuthorizationService() {
    }

    public static void requireOrganiserAccess(String uid, String eventId) {
        EventData event = EventsRepository.getEventById(eventId)
                .orElseThrow(() -> new AuthorizationException("Event not found: " + eventId));
        requireMatchingUser(uid, event.getOrganiserId(), "You are not allowed to manage this event");
    }

    public static void requireMatchingUser(String uid, String expectedUid, String message) {
        if (uid == null || expectedUid == null || !uid.equals(expectedUid)) {
            throw new AuthorizationException(message);
        }
    }
}
