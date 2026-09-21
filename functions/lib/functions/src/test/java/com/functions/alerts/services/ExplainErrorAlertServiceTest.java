package com.functions.alerts.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.Test;

import com.functions.alerts.clients.AlertSummaryPublisher;
import com.functions.alerts.clients.ErrorAlertDedupStore;
import com.functions.alerts.clients.LlmClient;
import com.functions.alerts.models.ParsedErrorLog;

public class ExplainErrorAlertServiceTest {

    @Test
    public void process_publishesTruncatedGeminiSummary() {
        RecordingPublisher publisher = new RecordingPublisher();
        ExplainErrorAlertService service = new ExplainErrorAlertService(
                new AllowOnceDedup(),
                prompt -> Optional.of("x".repeat(400)),
                publisher);

        service.process(sampleLog());

        assertEquals(1, publisher.bodies.size());
        assertEquals(SmsText.MAX_CHARS, publisher.bodies.get(0).length());
        assertTrue(publisher.bodies.get(0).endsWith("..."));
    }

    @Test
    public void process_fallsBackWhenGeminiBlank() {
        RecordingPublisher publisher = new RecordingPublisher();
        ExplainErrorAlertService service = new ExplainErrorAlertService(
                new AllowOnceDedup(),
                prompt -> Optional.empty(),
                publisher);

        service.process(sampleLog());

        assertEquals(1, publisher.bodies.size());
        assertTrue(publisher.bodies.get(0).contains("globalAppController"));
        assertTrue(publisher.bodies.get(0).contains("RuntimeException"));
        assertTrue(publisher.bodies.get(0).contains("WebhookService.process"));
    }

    @Test
    public void process_skipsWhenDedupRejects() {
        RecordingPublisher publisher = new RecordingPublisher();
        ExplainErrorAlertService service = new ExplainErrorAlertService(
                fingerprint -> false,
                prompt -> Optional.of("should not send"),
                publisher);

        service.process(sampleLog());

        assertTrue(publisher.bodies.isEmpty());
    }

    @Test
    public void processLogEntryJson_skipsWarningLogs() {
        RecordingPublisher publisher = new RecordingPublisher();
        ExplainErrorAlertService service = new ExplainErrorAlertService(
                new AllowOnceDedup(),
                prompt -> Optional.of("should not send"),
                publisher);

        service.processLogEntryJson("""
                {
                  "severity": "WARNING",
                  "textPayload": "Cannot checkout: vacancy",
                  "resource": { "labels": { "function_name": "globalAppController" } }
                }
                """);

        assertTrue(publisher.bodies.isEmpty());
    }

    @Test
    public void fallbackSms_includesFunctionExceptionAndFrame() {
        String body = ExplainErrorAlertService.fallbackSms(sampleLog());
        assertTrue(body.contains("globalAppController"));
        assertTrue(body.contains("RuntimeException"));
        assertTrue(body.contains("Failed to fulfill purchase"));
        assertTrue(body.contains("WebhookService.process"));
    }

    private static ParsedErrorLog sampleLog() {
        return new ParsedErrorLog(
                "globalAppController",
                "Failed to fulfill purchase\njava.lang.RuntimeException: boom",
                "RuntimeException",
                "com.functions.stripe.services.WebhookService.process(WebhookService.java:1128)");
    }

    private static final class RecordingPublisher implements AlertSummaryPublisher {
        private final List<String> bodies = new ArrayList<>();

        @Override
        public boolean publish(String summary) {
            bodies.add(summary);
            return true;
        }
    }

    private static final class AllowOnceDedup implements ErrorAlertDedupStore {
        private final Set<String> claimed = new HashSet<>();

        @Override
        public boolean tryClaim(String fingerprint) {
            return claimed.add(fingerprint);
        }
    }
}
