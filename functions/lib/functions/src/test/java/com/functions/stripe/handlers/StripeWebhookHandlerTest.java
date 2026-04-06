package com.functions.stripe.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

import org.junit.Test;

public class StripeWebhookHandlerTest {
    @Test
    public void readPayloadReturnsAsciiContentWithinLimit() throws Exception {
        String payload = "{\"type\":\"checkout.session.completed\"}";

        String result = StripeWebhookHandler.readPayload(
                new ByteArrayInputStream(payload.getBytes(StandardCharsets.UTF_8)),
                payload.getBytes(StandardCharsets.UTF_8).length);

        assertEquals(payload, result);
    }

    @Test
    public void readPayloadReturnsEmptyStringForEmptyPayload() throws Exception {
        assertEquals("", StripeWebhookHandler.readPayload(new ByteArrayInputStream(new byte[0]), 0));
    }

    @Test
    public void readPayloadRejectsMultiBytePayloadsThatExceedTheByteLimit() throws Exception {
        String oversizedPayload = "🙂".repeat((StripeWebhookHandler.MAX_PAYLOAD_SIZE / 4) + 1);

        try {
            StripeWebhookHandler.readPayload(
                    new ByteArrayInputStream(oversizedPayload.getBytes(StandardCharsets.UTF_8)),
                    oversizedPayload.getBytes(StandardCharsets.UTF_8).length);
            fail("Expected payload size guard to reject the request");
        } catch (StripeWebhookHandler.PayloadTooLargeException expected) {
            // expected
        }
    }
}
