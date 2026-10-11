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
    public void summarize_preservesShortSummariesAndCapsLongOnes() {
        ErrorAlertSummarizer shortSummary = new ErrorAlertSummarizer(
                prompt -> Optional.of("x".repeat(400)), parsed -> List.of());
        ErrorAlertSummarizer longSummary = new ErrorAlertSummarizer(
                prompt -> Optional.of("x".repeat(600)), parsed -> List.of());

        assertEquals(Optional.of("x".repeat(400)), shortSummary.summarize(sampleLog()));
        assertEquals(Optional.of("x".repeat(477) + "..."), longSummary.summarize(sampleLog()));
    }

    @Test
    public void summarize_returnsNoInterpretationWhenAiIsEmptyOrBlank() {
        for (Optional<String> answer : List.of(Optional.<String>empty(), Optional.of(" "))) {
            ErrorAlertSummarizer summarizer = new ErrorAlertSummarizer(prompt -> answer, parsed -> List.of());

            assertEquals(Optional.empty(), summarizer.summarize(sampleLog()));
        }
    }

    @Test
    public void summarize_returnsNoInterpretationWhenAiThrows() {
        ErrorAlertSummarizer summarizer = new ErrorAlertSummarizer(prompt -> {
            throw new IllegalStateException("Vertex unavailable");
        }, parsed -> List.of());

        assertEquals(Optional.empty(),
                summarizer.summarize(new ParsedErrorLog(
                        "emailService", "Request could not be processed", "", "")));
    }

    @Test
    public void summarize_redactsBothEvidenceAndAiOutput() {
        RecordingLlm llm = new RecordingLlm(Optional.of("Failed for jane.doe@example.com token=sk_live_abc123XYZ"));
        ErrorAlertSummarizer summarizer = new ErrorAlertSummarizer(llm,
                parsed -> List.of("INFO request for jane.doe@example.com token=sk_live_abc123XYZ"));

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
        List<ParsedErrorLog> fetched = new ArrayList<>();
        ErrorAlertSummarizer summarizer = new ErrorAlertSummarizer(llm, parsed -> {
            fetched.add(parsed);
            return List.of("WARNING HTTP POST status=400", "ERROR Invalid request, unable to process.");
        });
        ParsedErrorLog parsed = new ParsedErrorLog(
                "send-email-on-create-event-v2", "Invalid request, unable to process.", "", "",
                Instant.parse("2026-10-06T01:00:00Z"), "projects/p/traces/request", "POST", 400,
                "projects/p/logs/stderr", "request-error");

        assertEquals(Optional.empty(),
                summarizer.summarize(parsed));
        assertEquals(List.of(parsed), fetched);
        assertEquals(1, llm.prompts.size());
        String prompt = llm.prompts.get(0);
        assertTrue(prompt.contains("HTTP method: POST"));
        assertTrue(prompt.contains("HTTP status: 400"));
        assertTrue(prompt.contains("Exception: not present in supplied log"));
        assertTrue(prompt.contains("Top frame: not present in supplied log"));
        assertTrue(prompt.contains("WARNING HTTP POST status=400"));
        assertTrue(prompt.contains("ERROR Invalid request, unable to process."));
        assertTrue(prompt.contains("-----BEGIN UNTRUSTED ERROR LOG-----"));
        assertTrue(prompt.contains("-----END UNTRUSTED ERROR LOG-----"));
        assertTrue(prompt.contains("-----BEGIN UNTRUSTED NEARBY LOGS-----"));
        assertTrue(prompt.contains("-----END UNTRUSTED NEARBY LOGS-----"));
    }

    @Test
    public void summarize_stillIncludesTheErrorWhenNearbyFetchFails() {
        RecordingLlm llm = new RecordingLlm(Optional.empty());
        ErrorAlertSummarizer summarizer = new ErrorAlertSummarizer(llm, parsed -> {
            throw new IllegalStateException("logging unavailable");
        });

        Optional<String> body = summarizer.summarize(sampleLog());

        assertTrue(body.isEmpty());
        assertTrue(llm.prompts.get(0).contains("Log: Failed to fulfill purchase"));
        assertTrue(llm.prompts.get(0).contains("(none)"));
    }

    @Test
    public void formatNearbyLogs_keepsTheLastThirty() {
        List<String> lines = new ArrayList<>();
        for (int i = 0; i < 40; i++) {
            lines.add("INFO line-" + i);
        }

        String context = ErrorAlertSummarizer.formatNearbyLogs(lines);

        assertTrue(context.startsWith("-----BEGIN UNTRUSTED NEARBY LOGS-----\nINFO line-10\n"));
        assertTrue(context.contains("INFO line-39\n-----END UNTRUSTED NEARBY LOGS-----"));
        assertFalse(context.contains("INFO line-9\n"));
    }

    @Test
    public void formatNearbyLogs_dropsOldestLinesUntilWithinTheCharacterBudget() {
        String context = ErrorAlertSummarizer.formatNearbyLogs(
                List.of("x".repeat(5000), "y".repeat(5000), "z".repeat(5000)));

        assertEquals("-----BEGIN UNTRUSTED NEARBY LOGS-----\n" + "z".repeat(5000)
                + "\n-----END UNTRUSTED NEARBY LOGS-----", context);
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
