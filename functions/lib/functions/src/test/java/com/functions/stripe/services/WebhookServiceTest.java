package com.functions.stripe.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.util.Optional;

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

    @Test
    public void locatePaymentIntentEvent_prefersActivePrivate() {
        Optional<WebhookService.PaymentIntentEventLocation> location =
                WebhookService.locatePaymentIntentEvent(true, true, true, true);
        assertTrue(location.isPresent());
        assertTrue(location.get().isPrivate());
        assertTrue(location.get().isActive());
    }

    @Test
    public void locatePaymentIntentEvent_usesActivePublicWhenPrivateIsMissing() {
        Optional<WebhookService.PaymentIntentEventLocation> location =
                WebhookService.locatePaymentIntentEvent(false, true, true, true);
        assertTrue(location.isPresent());
        assertFalse(location.get().isPrivate());
        assertTrue(location.get().isActive());
    }

    @Test
    public void locatePaymentIntentEvent_usesInactivePrivateAfterArchival() {
        Optional<WebhookService.PaymentIntentEventLocation> location =
                WebhookService.locatePaymentIntentEvent(false, false, true, false);
        assertTrue(location.isPresent());
        assertTrue(location.get().isPrivate());
        assertFalse(location.get().isActive());
    }

    @Test
    public void locatePaymentIntentEvent_usesInactivePublicAfterArchival() {
        Optional<WebhookService.PaymentIntentEventLocation> location =
                WebhookService.locatePaymentIntentEvent(false, false, false, true);
        assertTrue(location.isPresent());
        assertFalse(location.get().isPrivate());
        assertFalse(location.get().isActive());
    }

    @Test
    public void locatePaymentIntentEvent_isEmptyWhenEventIsMissing() {
        assertTrue(WebhookService.locatePaymentIntentEvent(false, false, false, false).isEmpty());
    }
}
