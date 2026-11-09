package com.functions.alerts.services;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.Before;
import org.junit.Test;

import com.functions.alerts.clients.AlertSummaryPublisher;
import com.functions.alerts.clients.AlertClaimStore;
import com.functions.alerts.models.ErrorAlertNotification;
import com.functions.alerts.models.ParsedErrorLog;

public class ExplainErrorAlertServiceTest {
    private AlertClaimStore store;
    private List<ErrorAlertNotification> published;
    private ExplainErrorAlertService service;

    @Before
    public void setUp() {
        store = mock(AlertClaimStore.class);
        when(store.claim(any())).thenReturn(true);
        published = new ArrayList<>();
        service = service(published::add);
    }

    @Test
    public void process_trimsLongHeadlineToCompleteWordsWithoutEllipsis() {
        service.process(new ParsedErrorLog("globalAppController",
                "Stripe checkout session expired while fulfilling the webhook and then more words overflow "
                        + "the monitoring subject cap ".repeat(20),
                "RuntimeException",
                "WebhookService.process"));

        String headline = published.get(0).headline();
        assertTrue(headline.startsWith("globalAppController:"));
        assertFalse(headline.contains("Stripe checko..."));
        assertTrue(headline.getBytes(java.nio.charset.StandardCharsets.UTF_8).length <= SmsText.MAX_UTF8_BYTES);
    }

    @Test
    public void process_publishesFactsSeparatelyFromAiAfterClaimingFingerprintAndFunction() {
        service.process(sampleLog());

        ErrorAlertNotification notification = published.get(0);
        assertEquals("emailService: Request rejected", notification.headline());
        assertEquals("Unconfirmed explanation", notification.aiInterpretation());
        assertEquals("Unconfirmed explanation", notification.sms());
        assertEquals(sampleLog(), notification.evidence());
        verify(store).claim(notification.fingerprint());
        verify(store, never()).release(any());
    }

    @Test
    public void process_skipsRecentlyClaimedErrorsWithoutCallingAiOrPublisher() {
        when(store.claim(any())).thenReturn(false);
        service = new ExplainErrorAlertService(store, new ErrorAlertSummarizer(prompt -> {
            throw new AssertionError("Claimed errors must not call the model");
        }), published::add);
        service.process(sampleLog());
        assertTrue(published.isEmpty());
        verify(store, never()).release(any());
    }

    @Test
    public void process_pagesHeadlineWithoutAiWhenClaimStoreFails() {
        when(store.claim(any())).thenThrow(new IllegalStateException("Firestore unavailable"));
        service = service(published::add, prompt -> {
            throw new AssertionError("Unclaimed pages must not call the model");
        });
        service.process(sampleLog());
        assertEquals("emailService: Request rejected", published.get(0).sms());
    }

    @Test
    public void process_doesNotReleaseClaimsItNeverWrote() {
        when(store.claim(any())).thenThrow(new IllegalStateException("Firestore unavailable"));
        service = service(notification -> { throw new IllegalStateException("Logging unavailable"); });
        service.process(sampleLog());
        verify(store, never()).release(any());
    }

    @Test
    public void process_releasesClaimWithoutThrowingWhenPublicationFails() {
        service = service(notification -> { throw new IllegalStateException("Logging unavailable"); });
        doThrow(new IllegalStateException("Firestore unavailable")).when(store).release(any());
        service.process(sampleLog());
        verify(store).release(ErrorAlertFingerprint.of(sampleLog()));
    }

    @Test
    public void process_pagesCompleteAiSentenceEvenWhenShort() {
        service = service(published::add, prompt -> Optional.of(SmsTextTest.twoSentenceCheckoutFailure(303)));
        service.process(sampleLog());
        assertEquals("Checkout failed in globalAppController.", published.get(0).sms());
        assertFalse(published.get(0).sms().contains("and persist the"));
    }

    @Test
    public void process_keepsHeadlineAndFingerprintStableAcrossRequestUuids() {
        service.process(new ParsedErrorLog("stripeWebhook",
                "[Webhook-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa] Request rejected", "", ""));
        service.process(new ParsedErrorLog("stripeWebhook",
                "[Webhook-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb] Request rejected", "", ""));
        assertEquals(published.get(0).headline(), published.get(1).headline());
        assertEquals(published.get(0).fingerprint(), published.get(1).fingerprint());
    }

    @Test
    public void process_keepsFingerprintStableAcrossStackLineNumbers() {
        service.process(new ParsedErrorLog("globalAppController", "Request rejected", "RuntimeException",
                "com.functions.stripe.services.WebhookService.process(WebhookService.java:1128)"));
        service.process(new ParsedErrorLog("globalAppController", "Request rejected", "RuntimeException",
                "com.functions.stripe.services.WebhookService.process(WebhookService.java:1201)"));
        assertEquals(published.get(0).fingerprint(), published.get(1).fingerprint());
    }

    @Test
    public void process_separatesFunctionAndObservedExceptionInIncidentIdentity() {
        String message = "Organiser does not exist: organiserId=abc123";
        service.process(new ParsedErrorLog("send_email_on_purchase", message, "", ""));
        service.process(new ParsedErrorLog("other_function", message, "", ""));
        service.process(new ParsedErrorLog("send_email_on_purchase", message, "Error", ""));

        assertNotEquals(published.get(0).fingerprint(), published.get(1).fingerprint());
        assertNotEquals(published.get(0).fingerprint(), published.get(2).fingerprint());
    }

    @Test
    public void processLogEntryJson_filtersWarningsAndCallableGetBeforeClaiming() {
        service.processLogEntryJson("""
                {"severity":"WARNING","textPayload":"warning"}
                """);
        service.processLogEntryJson("""
                {"severity":"ERROR","textPayload":"Invalid request, unable to process.",
                 "labels":{"deployment-callable":"true"},
                 "httpRequest":{"requestMethod":"GET"},
                 "sourceLocation":{"function":"_on_call_handler"}}
                """);
        verify(store, never()).claim(any());
        assertTrue(published.isEmpty());
    }

    @Test
    public void processLogEntryJson_publishesHttpOnlyErrorsWithFactsWhenAiUnavailable() {
        service = new ExplainErrorAlertService(store,
                new ErrorAlertSummarizer(prompt -> Optional.empty()), published::add);
        service.processLogEntryJson("""
                {"severity":"ERROR","httpRequest":{"requestMethod":"POST","status":500},
                 "resource":{"labels":{"service_name":"emailService"}}}
                """);
        assertEquals("emailService: HTTP POST status=500", published.get(0).headline());
        assertEquals("", published.get(0).aiInterpretation());
    }

    @Test
    public void process_doesNotCollapseSpacelessMessageToFunctionNameOnly() {
        service.process(new ParsedErrorLog("createEvent", "x".repeat(400), "", ""));
        String headline = published.get(0).headline();
        assertFalse(headline.equals("createEvent:"));
        assertFalse(headline.equals("createEvent"));
        assertTrue(headline.startsWith("createEvent:"));
        assertTrue(headline.getBytes(java.nio.charset.StandardCharsets.UTF_8).length <= SmsText.MAX_UTF8_BYTES);
    }

    private ExplainErrorAlertService service(AlertSummaryPublisher publisher) {
        return service(publisher, prompt -> Optional.of("Unconfirmed explanation"));
    }

    private ExplainErrorAlertService service(AlertSummaryPublisher publisher,
            java.util.function.Function<String, Optional<String>> llm) {
        return new ExplainErrorAlertService(store,
                new ErrorAlertSummarizer(llm::apply),
                publisher);
    }

    private static ParsedErrorLog sampleLog() {
        return new ParsedErrorLog("emailService", "Request rejected", "", "");
    }
}
