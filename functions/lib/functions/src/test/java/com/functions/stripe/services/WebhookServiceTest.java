package com.functions.stripe.services;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class WebhookServiceTest {

    @Test
    public void shouldAcknowledgeExpiredCheckoutForDeletedEvent_whenActiveEventMissingAndDeletedExists() {
        assertTrue(WebhookService.shouldAcknowledgeExpiredCheckoutForDeletedEvent(false, true));
    }

    @Test
    public void shouldAcknowledgeExpiredCheckoutForDeletedEvent_whenActiveEventExists() {
        assertFalse(WebhookService.shouldAcknowledgeExpiredCheckoutForDeletedEvent(true, false));
        assertFalse(WebhookService.shouldAcknowledgeExpiredCheckoutForDeletedEvent(true, true));
    }

    @Test
    public void shouldAcknowledgeExpiredCheckoutForDeletedEvent_whenEventMissingEverywhere() {
        assertFalse(WebhookService.shouldAcknowledgeExpiredCheckoutForDeletedEvent(false, false));
    }
}
