package com.functions.stripe.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.util.HashMap;
import java.util.Map;

import org.junit.Test;

public class SessionMetadataTest {

    @Test
    public void fromStripeMetadataParsesRequiredFields() {
        SessionMetadata metadata = SessionMetadata.fromStripeMetadata(buildMetadata());

        assertEquals("event-123", metadata.getEventId());
        assertTrue(metadata.getIsPrivate());
        assertEquals("session-123", metadata.getFulfilmentSessionId());
        assertEquals("entity-123", metadata.getEndFulfilmentEntityId());
    }

    @Test
    public void fromStripeMetadataIgnoresLegacyCompleteFulfilmentSessionFlag() {
        Map<String, String> metadataMap = buildMetadata();
        metadataMap.put("completeFulfilmentSession", "true");

        SessionMetadata metadata = SessionMetadata.fromStripeMetadata(metadataMap);

        assertEquals("session-123", metadata.getFulfilmentSessionId());
        assertEquals("entity-123", metadata.getEndFulfilmentEntityId());
    }

    @Test
    public void fromStripeMetadataRequiresFulfilmentSessionId() {
        Map<String, String> metadataMap = buildMetadata();
        metadataMap.put("fulfilmentSessionId", "");

        expectIllegalArgument("Fulfilment Session Id", () -> SessionMetadata.fromStripeMetadata(metadataMap));
    }

    @Test
    public void fromStripeMetadataRequiresEndFulfilmentEntityId() {
        Map<String, String> metadataMap = buildMetadata();
        metadataMap.put("endFulfilmentEntityId", " ");

        expectIllegalArgument("End Fulfilment Entity Id", () -> SessionMetadata.fromStripeMetadata(metadataMap));
    }

    private static Map<String, String> buildMetadata() {
        Map<String, String> metadata = new HashMap<>();
        metadata.put("eventId", "event-123");
        metadata.put("isPrivate", "true");
        metadata.put("fulfilmentSessionId", "session-123");
        metadata.put("endFulfilmentEntityId", "entity-123");
        return metadata;
    }

    private static void expectIllegalArgument(String expectedMessagePart, ThrowingRunnable runnable) {
        try {
            runnable.run();
            fail("Expected IllegalArgumentException");
        } catch (IllegalArgumentException e) {
            assertTrue("Expected message to contain: " + expectedMessagePart,
                    e.getMessage().contains(expectedMessagePart));
        }
    }

    @FunctionalInterface
    private interface ThrowingRunnable {
        void run();
    }
}
