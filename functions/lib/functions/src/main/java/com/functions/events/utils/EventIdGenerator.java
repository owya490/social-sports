package com.functions.events.utils;

import com.github.f4b6a3.ulid.UlidCreator;

public final class EventIdGenerator {
    /** Must match the frontend `newEventId` helper: `evt_` plus a 26-character ULID. */
    private static final String EVENT_ID_PREFIX = "evt_";

    private EventIdGenerator() {
    }

    public static String newEventId() {
        return EVENT_ID_PREFIX + UlidCreator.getMonotonicUlid();
    }
}
