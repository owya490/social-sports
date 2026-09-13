package com.functions.events.utils;

import java.util.UUID;

public final class EventIdGenerator {
    private static final String EVENT_ID_PREFIX = "event_";

    private EventIdGenerator() {
    }

    public static String newEventId() {
        return EVENT_ID_PREFIX + UUID.randomUUID();
    }
}
