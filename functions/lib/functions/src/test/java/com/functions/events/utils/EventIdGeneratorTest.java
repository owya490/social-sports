package com.functions.events.utils;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.util.UUID;

import org.junit.Test;

public class EventIdGeneratorTest {
    @Test
    public void createsPrefixedUuidEventIds() {
        String eventId = EventIdGenerator.newEventId();

        assertTrue(eventId.startsWith("event_"));
        assertEquals(4, UUID.fromString(eventId.substring("event_".length())).version());
    }
}
