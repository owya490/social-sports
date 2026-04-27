package com.functions.stripe.models.requests;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import org.junit.Test;

public class CreateStripeStandardAccountRequestTest {

    @Test
    public void constructorAcceptsValidFields() {
        CreateStripeStandardAccountRequest request = new CreateStripeStandardAccountRequest(
                "organiser-123",
                "https://sportshub.com/return",
                "https://sportshub.com/refresh");

        assertEquals("organiser-123", request.organiser());
        assertEquals("https://sportshub.com/return", request.returnUrl());
        assertEquals("https://sportshub.com/refresh", request.refreshUrl());
    }

    @Test
    public void constructorRequiresOrganiser() {
        expectIllegalArgument("Organiser Id", () -> new CreateStripeStandardAccountRequest(
                " ",
                "https://sportshub.com/return",
                "https://sportshub.com/refresh"));
    }

    @Test
    public void constructorRequiresValidReturnUrl() {
        expectIllegalArgument("Return Url", () -> new CreateStripeStandardAccountRequest(
                "organiser-123",
                "not-a-url",
                "https://sportshub.com/refresh"));
    }

    @Test
    public void constructorRequiresValidRefreshUrl() {
        expectIllegalArgument("Refresh Url", () -> new CreateStripeStandardAccountRequest(
                "organiser-123",
                "https://sportshub.com/return",
                ""));
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
