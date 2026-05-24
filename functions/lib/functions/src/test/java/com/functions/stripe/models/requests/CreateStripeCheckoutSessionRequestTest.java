package com.functions.stripe.models.requests;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import org.junit.Test;

import com.stripe.param.checkout.SessionCreateParams.PaymentIntentData.CaptureMethod;

public class CreateStripeCheckoutSessionRequestTest {

    @Test
    public void constructorAcceptsRequiredFulfilmentFields() {
        CreateStripeCheckoutSessionRequest request = new CreateStripeCheckoutSessionRequest(
                "event-123",
                true,
                2,
                "https://sportshub.com/cancel",
                "https://sportshub.com/success",
                "session-123",
                "entity-123",
                CaptureMethod.AUTOMATIC);

        assertEquals("session-123", request.fulfilmentSessionId());
        assertEquals("entity-123", request.endFulfilmentEntityId());
        assertEquals(CaptureMethod.AUTOMATIC, request.captureMethod());
    }

    @Test
    public void constructorRequiresFulfilmentSessionId() {
        expectIllegalArgument("Fulfilment Session ID", () -> new CreateStripeCheckoutSessionRequest(
                "event-123",
                true,
                2,
                "https://sportshub.com/cancel",
                "https://sportshub.com/success",
                "",
                "entity-123",
                CaptureMethod.AUTOMATIC));
    }

    @Test
    public void constructorRequiresEndFulfilmentEntityId() {
        expectIllegalArgument("End Fulfilment Entity ID", () -> new CreateStripeCheckoutSessionRequest(
                "event-123",
                true,
                2,
                "https://sportshub.com/cancel",
                "https://sportshub.com/success",
                "session-123",
                " ",
                CaptureMethod.AUTOMATIC));
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
