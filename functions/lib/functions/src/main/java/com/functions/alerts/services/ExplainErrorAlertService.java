package com.functions.alerts.services;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.alerts.clients.AlertSummaryPublisher;
import com.functions.alerts.clients.ErrorAlertDedupStore;
import com.functions.alerts.clients.GcpLogAlertPublisher;
import com.functions.alerts.clients.GeminiClient;
import com.functions.alerts.clients.LlmClient;
import com.functions.alerts.models.ParsedErrorLog;
import com.functions.alerts.repositories.ErrorAlertDedupRepository;

public class ExplainErrorAlertService {
    private static final Logger logger = LoggerFactory.getLogger(ExplainErrorAlertService.class);

    private final ErrorAlertDedupStore dedupStore;
    private final LlmClient llmClient;
    private final AlertSummaryPublisher summaryPublisher;

    public ExplainErrorAlertService(
            ErrorAlertDedupStore dedupStore,
            LlmClient llmClient,
            AlertSummaryPublisher summaryPublisher) {
        this.dedupStore = dedupStore;
        this.llmClient = llmClient;
        this.summaryPublisher = summaryPublisher;
    }

    public static ExplainErrorAlertService fromEnv() {
        return new ExplainErrorAlertService(
                new ErrorAlertDedupRepository(),
                new GeminiClient(),
                new GcpLogAlertPublisher());
    }

    public void processLogEntryJson(String logEntryJson) {
        Optional<ParsedErrorLog> parsed = CloudLogEntryParser.parse(logEntryJson);
        if (parsed.isEmpty()) {
            logger.info("Skipping error alert; log entry was not an actionable ERROR");
            return;
        }
        process(parsed.get());
    }

    public void process(ParsedErrorLog parsed) {
        String fingerprint = CloudLogEntryParser.fingerprint(parsed);
        if (!dedupStore.tryClaim(fingerprint)) {
            logger.info("Skipping duplicate error alert fingerprint={}", fingerprint);
            return;
        }

        String body = SmsText.truncate(summarize(parsed));
        boolean published = summaryPublisher.publish(body);
        logger.info("Error alert summary publish complete. function={} fingerprint={} published={}",
                parsed.functionName(), fingerprint, published);
    }

    private String summarize(ParsedErrorLog parsed) {
        Optional<String> summary = llmClient.summarize(buildPrompt(parsed));
        if (summary.isPresent() && !summary.get().isBlank()) {
            return summary.get();
        }
        return fallbackSms(parsed);
    }

    static String buildPrompt(ParsedErrorLog parsed) {
        return """
                You page SPORTSHUB on-call via SMS.
                Summarize this Cloud Function ERROR in at most 320 characters.
                No markdown. No quotes. Be specific.
                Include: function name, what failed, likely cause, and the first class/method to open if present.

                Function: %s
                Exception: %s
                Top frame: %s
                Log:
                %s
                """.formatted(
                parsed.functionName(),
                parsed.exceptionType(),
                parsed.topFrame() == null || parsed.topFrame().isBlank() ? "unknown" : parsed.topFrame(),
                SmsText.truncate(parsed.message(), 2500));
    }

    static String fallbackSms(ParsedErrorLog parsed) {
        String exception = parsed.exceptionType() == null || parsed.exceptionType().isBlank()
                ? "Error"
                : parsed.exceptionType();
        String firstLine = parsed.message() == null ? "" : parsed.message().strip().split("\\R", 2)[0];
        String frame = parsed.topFrame() == null || parsed.topFrame().isBlank() ? "" : " at " + parsed.topFrame();
        return parsed.functionName() + ": " + exception + " " + firstLine + frame;
    }
}
