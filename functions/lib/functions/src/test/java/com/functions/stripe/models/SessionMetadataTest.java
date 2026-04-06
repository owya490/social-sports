package com.functions.stripe.models;

import java.util.Map;

import org.junit.Test;

public class SessionMetadataTest {
    @Test(expected = IllegalArgumentException.class)
    public void fromStripeMetadataRejectsBlankEventId() {
        SessionMetadata.fromStripeMetadata(Map.of(
                "eventId", "   ",
                "isPrivate", "true",
                "completeFulfilmentSession", "false"));
    }

    @Test(expected = IllegalArgumentException.class)
    public void fromStripeMetadataRejectsBlankFulfilmentSessionFieldsWhenCompletionIsEnabled() {
        SessionMetadata.fromStripeMetadata(Map.of(
                "eventId", "event-123",
                "isPrivate", "true",
                "completeFulfilmentSession", "true",
                "fulfilmentSessionId", " ",
                "endFulfilmentEntityId", "entity-123"));
    }
}
