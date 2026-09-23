package com.functions.events.utils;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;

import java.time.Instant;

import org.junit.Test;

import com.github.f4b6a3.ulid.Ulid;

public class EventIdGeneratorTest {
    private static final String EVENT_ID_PREFIX = "evt_";

    @Test
    public void createsPrefixedUlidEventIds() {
        String eventId = EventIdGenerator.newEventId();

        assertTrue(eventId.startsWith(EVENT_ID_PREFIX));
        Ulid ulid = Ulid.from(eventId.substring(EVENT_ID_PREFIX.length()));
        assertEquals(26, ulid.toString().length());
        assertTrue(Math.abs(ulid.getInstant().toEpochMilli() - Instant.now().toEpochMilli()) < 5_000);
    }

    @Test
    public void createsDistinctOrderedEventIds() {
        String first = EventIdGenerator.newEventId();
        String second = EventIdGenerator.newEventId();

        assertNotEquals(first, second);
        assertTrue(first.compareTo(second) < 0);
    }
}
