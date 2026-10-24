package com.functions.stripe.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import com.stripe.model.checkout.Session;

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

    @Test
    public void resolveApplicationFeesAndDiscountsTreatMissingTotalsAsZero() {
        assertEquals(0L, WebhookService.resolveApplicationFees(null));
        assertEquals(0L, WebhookService.resolveDiscounts(null));

        Session.TotalDetails details = new Session.TotalDetails();
        details.setAmountShipping(250L);
        details.setAmountDiscount(100L);
        assertEquals(250L, WebhookService.resolveApplicationFees(details));
        assertEquals(100L, WebhookService.resolveDiscounts(details));
    }
}
