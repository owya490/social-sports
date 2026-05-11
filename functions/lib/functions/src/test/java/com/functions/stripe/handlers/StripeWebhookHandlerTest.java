package com.functions.stripe.handlers;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class StripeWebhookHandlerTest {

    @Test
    public void isFreeCheckoutSession_returnsTrueForZeroAmount() {
        assertTrue(StripeWebhookHandler.isFreeCheckoutSession(0L));
    }

    @Test
    public void isFreeCheckoutSession_returnsFalseForNullAmount() {
        assertFalse(StripeWebhookHandler.isFreeCheckoutSession(null));
    }

    @Test
    public void isFreeCheckoutSession_returnsFalseForPositiveAmount() {
        assertFalse(StripeWebhookHandler.isFreeCheckoutSession(2500L));
    }
}
