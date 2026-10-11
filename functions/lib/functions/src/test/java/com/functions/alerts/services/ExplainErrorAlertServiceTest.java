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
import com.functions.alerts.clients.ErrorAlertDedupStore;
import com.functions.alerts.clients.ErrorAlertDedupStore.Reservation;
import com.functions.alerts.models.ErrorAlertNotification;
import com.functions.alerts.models.ParsedErrorLog;

public class ExplainErrorAlertServiceTest {
    private ErrorAlertDedupStore store;
    private List<ErrorAlertNotification> published;
    private ExplainErrorAlertService service;

    @Before
    public void setUp() {
        store = mock(ErrorAlertDedupStore.class);
        when(store.reserve()).thenReturn(Optional.of(new Reservation("owner")));
        published = new ArrayList<>();
        service = service(published::add);
    }

    @Test
    public void process_publishesFactsSeparatelyFromAiAndCompletesReservation() {
        service.process(sampleLog());

        ErrorAlertNotification notification = published.get(0);
        assertEquals("emailService: Request rejected", notification.headline());
        assertEquals("Unconfirmed explanation", notification.aiInterpretation());
        assertEquals(sampleLog(), notification.evidence());
        verify(store).complete(new Reservation("owner"));
        verify(store, never()).release(any());
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

    private ExplainErrorAlertService service(AlertSummaryPublisher publisher) {
        return new ExplainErrorAlertService(store,
                new ErrorAlertSummarizer(prompt -> Optional.of("Unconfirmed explanation"), parsed -> List.of()),
                publisher);
    }

    private static ParsedErrorLog sampleLog() {
        return new ParsedErrorLog("emailService", "Request rejected", "", "");
    }
}
