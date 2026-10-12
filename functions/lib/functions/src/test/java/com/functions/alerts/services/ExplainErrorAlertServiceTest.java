package com.functions.alerts.services;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.Before;
import org.junit.Test;

import com.functions.alerts.clients.AlertSummaryPublisher;
import com.functions.alerts.clients.ErrorAlertDedupStore;
import com.functions.alerts.clients.ErrorAlertDedupStore.Reservation;
import com.functions.alerts.models.ErrorAlertNotification;
import com.functions.alerts.models.ParsedErrorLog;
import com.functions.alerts.repositories.ErrorAlertDedupRepository;

public class ExplainErrorAlertServiceTest {
    private ErrorAlertDedupStore store;
    private List<ErrorAlertNotification> published;
    private ExplainErrorAlertService service;

    @Before
    public void setUp() {
        store = mock(ErrorAlertDedupStore.class);
        when(store.reserve()).thenReturn(Optional.of(new Reservation("owner")));
        when(store.smsFor(any())).thenReturn(Optional.empty());
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
    public void process_publishesFactsSeparatelyFromAiAndCompletesReservation() {
        service.process(sampleLog());

        ErrorAlertNotification notification = published.get(0);
        assertEquals("emailService: Request rejected", notification.headline());
        assertEquals("Unconfirmed explanation", notification.aiInterpretation());
        assertEquals("Unconfirmed explanation", notification.sms());
        assertEquals(sampleLog(), notification.evidence());
        verify(store).rememberSms(notification.fingerprint(), "Unconfirmed explanation");
        verify(store).complete(new Reservation("owner"));
        verify(store, never()).release(any());
    }

    @Test
    public void process_reusesPersistedSmsSoExtractorIdentityStaysStable() {
        when(store.smsFor(any())).thenReturn(Optional.of("Persisted SMS sentence."));
        service = service(published::add, prompt -> Optional.of("Different Gemini wording this time."));
        service.process(sampleLog());
        assertEquals("Persisted SMS sentence.", published.get(0).sms());
        assertEquals("Different Gemini wording this time.", published.get(0).aiInterpretation());
        verify(store, never()).rememberSms(any(), any());
    }

    @Test
    public void processLogEntryJson_reusesSmsInsideIncidentWindowThenRefreshesAfterExpiry() {
        ExpiringSmsStore expiring = new ExpiringSmsStore(Instant.parse("2026-10-11T03:00:00Z"));
        service = new ExplainErrorAlertService(expiring,
                new ErrorAlertSummarizer(this::emailServiceStatusInterpretation, parsed -> List.of()),
                published::add);

        service.processLogEntryJson(emailServiceHttpError(503));
        assertEquals("Email service returned 503.", published.get(0).sms());

        expiring.advance(Duration.ofDays(1));
        service.processLogEntryJson(emailServiceHttpError(403));
        assertEquals("Email service returned 503.", published.get(1).sms());
        assertEquals(published.get(0).fingerprint(), published.get(1).fingerprint());

        expiring.advance(Duration.ofDays(30));
        service.processLogEntryJson(emailServiceHttpError(403));
        assertEquals("Email service returned 403.", published.get(2).sms());
        assertEquals(published.get(0).fingerprint(), published.get(2).fingerprint());
        assertNotEquals(published.get(0).sms(), published.get(2).sms());
    }

    @Test
    public void process_pagesCompleteAiSentenceEvenWhenShort() {
        service = service(published::add, prompt -> Optional.of(SmsTextTest.twoSentenceCheckoutFailure(303)));
        service.process(sampleLog());
        assertEquals("Checkout failed in globalAppController.", published.get(0).sms());
        assertFalse(published.get(0).sms().contains("and persist the"));
        verify(store).rememberSms(eq(published.get(0).fingerprint()), eq("Checkout failed in globalAppController."));
    }

    @Test
    public void process_propagatesInFlightLeaseSoPubSubRedelivers() {
        when(store.reserve()).thenThrow(new IllegalStateException("Error alert delivery already in progress"));
        try {
            service.process(sampleLog());
            fail("In-flight delivery must not ack");
        } catch (IllegalStateException expected) {
            assertEquals("Error alert delivery already in progress", expected.getMessage());
        }
        assertTrue(published.isEmpty());
        verify(store, never()).complete(any());
    }

    @Test
    public void process_skipsSuppressedErrorsWithoutCallingAiOrPublisher() {
        when(store.reserve()).thenReturn(Optional.empty());
        service = new ExplainErrorAlertService(store, new ErrorAlertSummarizer(prompt -> {
            throw new AssertionError("Suppressed errors must not call the model");
        }, parsed -> List.of()), published::add);
        service.process(sampleLog());
        assertTrue(published.isEmpty());
        verify(store, never()).complete(any());
    }

    @Test
    public void process_releasesAndPropagatesPublicationFailure() {
        service = service(notification -> { throw new IllegalStateException("Logging unavailable"); });
        try {
            service.process(sampleLog());
            fail("Publication failure must reach the trigger");
        } catch (IllegalStateException expected) {
            assertEquals("Logging unavailable", expected.getMessage());
        }
        verify(store).release(any());
        verify(store, never()).complete(any());
    }

    @Test
    public void process_doesNotReleaseAfterPublicationWhenCompletionFails() {
        doThrow(new IllegalStateException("commit failed")).when(store).complete(any());
        try {
            service.process(sampleLog());
            fail("Completion failure must reach the trigger");
        } catch (IllegalStateException expected) {
            assertEquals(1, published.size());
        }
        verify(store, never()).release(any());
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
    public void process_separatesFunctionAndObservedExceptionInIncidentIdentity() {
        String message = "Organiser does not exist: organiserId=abc123";
        service.process(new ParsedErrorLog("send_email_on_purchase", message, "", ""));
        service.process(new ParsedErrorLog("other_function", message, "", ""));
        service.process(new ParsedErrorLog("send_email_on_purchase", message, "Error", ""));

        assertNotEquals(published.get(0).fingerprint(), published.get(1).fingerprint());
        assertNotEquals(published.get(0).fingerprint(), published.get(2).fingerprint());
    }

    @Test
    public void processLogEntryJson_filtersWarningsAndCallableGetBeforeReservations() {
        service.processLogEntryJson("""
                {"severity":"WARNING","textPayload":"warning"}
                """);
        service.processLogEntryJson("""
                {"severity":"ERROR","textPayload":"Invalid request, unable to process.",
                 "labels":{"deployment-callable":"true"},
                 "httpRequest":{"requestMethod":"GET"},
                 "sourceLocation":{"function":"_on_call_handler"}}
                """);
        verify(store, never()).reserve();
        assertTrue(published.isEmpty());
    }

    @Test
    public void processLogEntryJson_publishesHttpOnlyErrorsWithFactsWhenAiUnavailable() {
        service = new ExplainErrorAlertService(store,
                new ErrorAlertSummarizer(prompt -> Optional.empty(), parsed -> List.of()), published::add);
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
                new ErrorAlertSummarizer(llm::apply, parsed -> List.of()),
                publisher);
    }

    private static ParsedErrorLog sampleLog() {
        return new ParsedErrorLog("emailService", "Request rejected", "", "");
    }

    private Optional<String> emailServiceStatusInterpretation(String prompt) {
        if (prompt.contains("HTTP status: 503")) {
            return Optional.of("Email service returned 503.");
        }
        if (prompt.contains("HTTP status: 403")) {
            return Optional.of("Email service returned 403.");
        }
        return Optional.of("Unconfirmed explanation");
    }

    private static String emailServiceHttpError(int status) {
        return """
                {"severity":"ERROR","textPayload":"Request rejected",
                 "httpRequest":{"requestMethod":"POST","status":%d},
                 "resource":{"labels":{"service_name":"emailService"}}}
                """.formatted(status);
    }

    private static final class ExpiringSmsStore implements ErrorAlertDedupStore {
        private Instant now;
        private final Map<String, String> smsByFingerprint = new HashMap<>();
        private final Map<String, Instant> savedAtByFingerprint = new HashMap<>();

        ExpiringSmsStore(Instant now) {
            this.now = now;
        }

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public Optional<Reservation> reserve() {
            return Optional.of(new Reservation("owner"));
        }

        @Override
        public void complete(Reservation reservation) {
        }

        @Override
        public void release(Reservation reservation) {
        }

        @Override
        public Optional<String> smsFor(String fingerprint) {
            String sms = smsByFingerprint.get(fingerprint);
            Instant savedAt = savedAtByFingerprint.get(fingerprint);
            if (sms == null || savedAt == null
                    || !savedAt.isAfter(now.minus(ErrorAlertDedupRepository.SMS_INCIDENT_WINDOW))) {
                return Optional.empty();
            }
            savedAtByFingerprint.put(fingerprint, now);
            return Optional.of(sms);
        }

        @Override
        public void rememberSms(String fingerprint, String sms) {
            if (smsFor(fingerprint).isPresent()) {
                return;
            }
            smsByFingerprint.put(fingerprint, sms);
            savedAtByFingerprint.put(fingerprint, now);
        }
    }
}
