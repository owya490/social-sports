package com.functions.stripe.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertTrue;

import java.util.concurrent.ExecutionException;

import org.junit.Test;

import com.google.api.gax.grpc.GrpcStatusCode;
import com.google.api.gax.rpc.AbortedException;
import com.google.api.gax.rpc.ApiException;
import com.stripe.model.checkout.Session;

import io.grpc.Status;

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
    public void toTransactionFailure_rethrowsWrappedAbortedExceptionUnwrappedSoFirestoreRetries() {
        ApiException aborted = new AbortedException("contention", null, GrpcStatusCode.of(Status.Code.ABORTED), false);

        RuntimeException failure = WebhookService.toTransactionFailure(
                "ctx", new ExecutionException(aborted));

        assertSame(aborted, failure);
    }

    @Test
    public void toTransactionFailure_wrapsOtherFailures() {
        IllegalStateException cause = new IllegalStateException("boom");

        RuntimeException failure = WebhookService.toTransactionFailure("ctx", cause);

        assertEquals("Transaction failed", failure.getMessage());
        assertSame(cause, failure.getCause());
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
