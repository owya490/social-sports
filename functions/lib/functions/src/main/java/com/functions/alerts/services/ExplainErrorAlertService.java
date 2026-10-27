package com.functions.alerts.services;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.alerts.clients.AlertSummaryPublisher;
import com.functions.alerts.clients.ErrorAlertDedupStore;
import com.functions.alerts.models.ParsedErrorLog;
import com.functions.alerts.models.ErrorAlertNotification;
import com.functions.alerts.clients.ErrorAlertDedupStore.Reservation;

public class ExplainErrorAlertService {
    private static final Logger logger = LoggerFactory.getLogger(ExplainErrorAlertService.class);

    private final ErrorAlertDedupStore dedupStore;
    private final ErrorAlertSummarizer summarizer;
    private final AlertSummaryPublisher summaryPublisher;

    public ExplainErrorAlertService(ErrorAlertDedupStore dedupStore, ErrorAlertSummarizer summarizer,
            AlertSummaryPublisher summaryPublisher) {
        this.dedupStore = dedupStore;
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
        if (dedupStore.smsFor(fingerprint).isPresent()) {
            logger.info("Skipping error alert; fingerprint already paged fingerprint={}", fingerprint);
            return;
        }
        Optional<Reservation> claim = dedupStore.reserve();
        if (claim.isEmpty()) {
            logger.info("Skipping error alert; notification budget is active fingerprint={}", fingerprint);
            return;
        }

        Reservation reservation = claim.get();
        try {
            String headline = SmsText.forHeadline(
                    parsed.functionName() + ": " + ErrorAlertFingerprint.normalizedFirstLine(parsed.message()));
            String interpretation = summarizer.summarize(parsed).orElse("");
            String sms = smsForPublish(fingerprint, headline, interpretation);
            summaryPublisher.publish(new ErrorAlertNotification(
                    fingerprint, headline, parsed, interpretation, sms));
        } catch (RuntimeException failure) {
            try {
                dedupStore.release(reservation);
            } catch (RuntimeException releaseFailure) {
                failure.addSuppressed(releaseFailure);
            }
            throw failure;
        }
        // Publication has happened; failed completion must not release another delivery attempt early.
        dedupStore.complete(reservation, fingerprint);
        logger.info("Error alert published. function={} fingerprint={}", parsed.functionName(), fingerprint);
    }

    private String smsForPublish(String fingerprint, String headline, String interpretation) {
        String sms = interpretation.isBlank() ? headline : SmsText.forSmsSubject(interpretation);
        dedupStore.rememberSms(fingerprint, sms);
        return sms;
    }
}
