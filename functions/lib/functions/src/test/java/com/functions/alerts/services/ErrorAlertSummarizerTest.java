package com.functions.alerts.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.Test;

import com.functions.alerts.clients.LlmClient;
import com.functions.alerts.models.ParsedErrorLog;

public class ErrorAlertSummarizerTest {
    @Test
    public void summarize_keepsCompleteSentencesInsideTheSmsByteCap() {
        String first = "Checkout failed in globalAppController while fulfilling the webhook purchase for this customer order just today.";
        String second = "This looks like a Stripe checkout timeout at WebhookService.process so check the expired session "
                + "and then check the fulfillment logs for the matching payment intent in Cloud Logging next.";
        String overflow = first + " " + second + " Extra filler keeps going " + "word ".repeat(120);
        ErrorAlertSummarizer summarizer = new ErrorAlertSummarizer(
                prompt -> Optional.of(overflow));

        String body = summarizer.summarize(sampleLog()).orElseThrow();
        assertTrue(body.length() <= SmsText.MAX_CHARS);
        assertTrue(body.endsWith("."));
        assertFalse(body.endsWith("..."));
        assertTrue(body.contains(first));
        assertFalse(body.contains("Extra filler"));
    }

    @Test
    public void buildPrompt_requiresSteCompleteSentencesAndUntrustedLogs() {
        String prompt = ErrorAlertSummarizer.buildPrompt(sampleLog());
        assertTrue(prompt.contains("ASD-STE100"));
        assertTrue(prompt.contains("complete sentences"));
        assertTrue(prompt.contains("255 UTF-8 bytes"));
        assertTrue(prompt.contains("what failed"));
        assertTrue(prompt.contains("untrusted evidence"));
        assertFalse(prompt.contains("defense in depth"));
    }

    @Test
    public void summarize_returnsNoInterpretationWhenAiIsEmptyOrBlank() {
        for (Optional<String> answer : List.of(Optional.<String>empty(), Optional.of(" "))) {
            ErrorAlertSummarizer summarizer = new ErrorAlertSummarizer(prompt -> answer);

            assertEquals(Optional.empty(), summarizer.summarize(sampleLog()));
        }
    }

    @Test
    public void summarize_returnsNoInterpretationWhenAiThrows() {
        ErrorAlertSummarizer summarizer = new ErrorAlertSummarizer(prompt -> {
            throw new IllegalStateException("Vertex unavailable");
        });

        assertEquals(Optional.empty(),
                summarizer.summarize(new ParsedErrorLog(
                        "emailService", "Request could not be processed", "", "")));
    }

    @Test
    public void summarize_redactsBothEvidenceAndAiOutput() {
        RecordingLlm llm = new RecordingLlm(Optional.of("Failed for jane.doe@example.com token=sk_live_abc123XYZ"));
        ErrorAlertSummarizer summarizer = new ErrorAlertSummarizer(llm);

        String body = summarizer.summarize(new ParsedErrorLog(
                "emailService",
                "Failed for jane.doe@example.com token=sk_live_abc123XYZ",
                "RuntimeException",
                "EmailService.send(EmailService.java:155)")).orElseThrow();

        assertEquals("Failed for [REDACTED_EMAIL] token=[REDACTED]", body);
        assertTrue(llm.prompts.get(0).contains("[REDACTED_EMAIL]"));
        assertFalse(llm.prompts.get(0).contains("jane.doe@example.com"));
        assertFalse(llm.prompts.get(0).contains("sk_live_abc123XYZ"));
    }

    @Test
    public void summarize_preservesTraceAndHttpEvidenceWithoutInventingAnException() {
        RecordingLlm llm = new RecordingLlm(Optional.empty());
        ErrorAlertSummarizer summarizer = new ErrorAlertSummarizer(llm);
        ParsedErrorLog parsed = new ParsedErrorLog(
                "send-email-on-create-event-v2", "Invalid request, unable to process.", "", "",
                Instant.parse("2026-10-06T01:00:00Z"), "projects/p/traces/request", "POST", 400,
                "projects/p/logs/stderr", "request-error");

        assertEquals(Optional.empty(),
                summarizer.summarize(parsed));
        assertEquals(1, llm.prompts.size());
        String prompt = llm.prompts.get(0);
        assertTrue(prompt.contains("HTTP method: POST"));
        assertTrue(prompt.contains("HTTP status: 400"));
        assertTrue(prompt.contains("Exception: not present in supplied log"));
        assertTrue(prompt.contains("Top frame: not present in supplied log"));
        assertTrue(prompt.contains("Log: Invalid request, unable to process."));
        assertTrue(prompt.contains("-----BEGIN UNTRUSTED ERROR LOG-----"));
        assertTrue(prompt.contains("-----END UNTRUSTED ERROR LOG-----"));
    }

    private static ParsedErrorLog sampleLog() {
        return new ParsedErrorLog(
                "globalAppController",
                "Failed to fulfill purchase\njava.lang.RuntimeException: boom",
                "RuntimeException",
                "com.functions.stripe.services.WebhookService.process(WebhookService.java:1128)");
    }

    private static final class RecordingLlm implements LlmClient {
        private final List<String> prompts = new ArrayList<>();
        private final Optional<String> answer;

        private RecordingLlm(Optional<String> answer) {
            this.answer = answer;
        }

        @Override
        public Optional<String> summarize(String prompt) {
            prompts.add(prompt);
            return answer;
        }
    }
}
