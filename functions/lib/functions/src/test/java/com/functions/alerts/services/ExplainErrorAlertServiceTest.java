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
        assertTrue(publisher.bodies.get(0).length() <= SmsText.MAX_UTF8_BYTES);
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
    public void process_redactsEmailBeforePublishAndPrompt() {
        RecordingPublisher publisher = new RecordingPublisher();
        RecordingLlm llm = new RecordingLlm();
        ExplainErrorAlertService service = new ExplainErrorAlertService(
                new AllowOnceDedup(),
                llm,
                publisher);

        service.process(new ParsedErrorLog(
                "emailService",
                "Failed to send to jane.doe@example.com token=sk_live_abc123XYZ",
                "RuntimeException",
                "EmailService.send(EmailService.java:155)"));

        assertEquals(1, publisher.bodies.size());
        assertTrue(publisher.bodies.get(0).contains("[REDACTED_EMAIL]"));
        assertTrue(publisher.bodies.get(0).contains("[REDACTED]"));
        assertTrue(!publisher.bodies.get(0).contains("jane.doe@example.com"));
        assertTrue(!publisher.bodies.get(0).contains("sk_live_abc123XYZ"));
        assertTrue(llm.prompts.get(0).contains("[REDACTED_EMAIL]"));
        assertTrue(!llm.prompts.get(0).contains("jane.doe@example.com"));
    }

    @Test
    public void process_doesNotMarkSentWhenPublishFails() {
        TrackingDedup dedup = new TrackingDedup();
        ExplainErrorAlertService service = new ExplainErrorAlertService(
                dedup,
                prompt -> Optional.of("summary"),
                summary -> false);

        service.process(sampleLog());

        assertEquals(1, dedup.claims);
        assertEquals(0, dedup.markedSent);
    }

    @Test
    public void process_marksSentAfterSuccessfulPublish() {
        TrackingDedup dedup = new TrackingDedup();
        ExplainErrorAlertService service = new ExplainErrorAlertService(
                dedup,
                prompt -> Optional.empty(),
                summary -> true);

        service.process(sampleLog());

        assertEquals(1, dedup.claims);
        assertEquals(1, dedup.markedSent);
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

    private static final class TrackingDedup implements ErrorAlertDedupStore {
        private int claims;
        private int markedSent;

        @Override
        public boolean tryClaim(String fingerprint) {
            claims++;
            return true;
        }

        @Override
        public void markSent(String fingerprint) {
            markedSent++;
        }
    }

    private static final class RecordingLlm implements LlmClient {
        private final List<String> prompts = new ArrayList<>();

        @Override
        public Optional<String> summarize(String prompt) {
            prompts.add(prompt);
            return Optional.empty();
        }
    }
}
