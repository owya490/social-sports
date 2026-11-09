package com.functions.alerts.services;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.alerts.clients.AlertClaimStore;
import com.functions.alerts.clients.AlertClaimStore.Claim;
import com.functions.alerts.clients.AlertSummaryPublisher;
import com.functions.alerts.models.ErrorAlertNotification;
import com.functions.alerts.models.ParsedErrorLog;

/**
 * Pages once per new error. Never throws: the function is deployed without
 * Pub/Sub retry, so a failure costs at most one SMS instead of a redelivery storm.
 */
public class ExplainErrorAlertService {
    private static final Logger logger = LoggerFactory.getLogger(ExplainErrorAlertService.class);

    private final AlertClaimStore claimStore;
    private final ErrorAlertSummarizer summarizer;
    private final AlertSummaryPublisher summaryPublisher;

    public ExplainErrorAlertService(AlertClaimStore claimStore, ErrorAlertSummarizer summarizer,
            AlertSummaryPublisher summaryPublisher) {
        this.claimStore = claimStore;
        this.summarizer = summarizer;
        this.summaryPublisher = summaryPublisher;
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
        String fingerprint = ErrorAlertFingerprint.of(parsed);
        Optional<Claim> claim = Optional.empty();
        boolean deduped = true;
        try {
            claim = claimStore.claim(fingerprint);
            if (claim.isEmpty()) {
                logger.info("Skipping error alert; recently paged or daily budget spent function={} fingerprint={}",
                        parsed.functionName(), fingerprint);
                return;
            }
        } catch (RuntimeException failure) {
            // Fails open: a page during a Firestore outage beats a silent one.
            logger.warn("Error alert claim unavailable; paging headline without dedup failure={}",
                    failure.getClass().getSimpleName());
            deduped = false;
        }

        String headline = SmsText.forHeadline(
                parsed.functionName() + ": " + ErrorAlertFingerprint.normalizedFirstLine(parsed.message()));
        // Without dedup, a stable headline lets Monitoring fold repeats into one open incident.
        String interpretation = deduped ? summarizer.summarize(parsed).orElse("") : "";
        String sms = SmsText.forSmsSubject(interpretation.isBlank() ? headline : interpretation);
        try {
            summaryPublisher.publish(new ErrorAlertNotification(fingerprint, headline, parsed, interpretation, sms));
        } catch (RuntimeException failure) {
            logger.warn("Error alert not published function={} fingerprint={} failure={}",
                    parsed.functionName(), fingerprint, failure.getClass().getSimpleName());
            claim.ifPresent(this::release);
            return;
        }
        logger.info("Error alert published. function={} fingerprint={}", parsed.functionName(), fingerprint);
    }

    private void release(Claim claim) {
        try {
            claimStore.release(claim);
        } catch (RuntimeException failure) {
            logger.warn("Error alert claim release failed; it expires on its own failure={}",
                    failure.getClass().getSimpleName());
        }
    }
}
