package com.functions.alerts.clients;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Publishes the AI summary as a Cloud Logging line so the existing GCP SMS
 * notification channel can page it as a log-based alert — the same path as
 * today's ERROR texts. Severity is INFO, never ERROR, so this cannot recurse
 * into the ERROR sink.
 */
public class GcpLogAlertPublisher implements AlertSummaryPublisher {
    private static final Logger logger = LoggerFactory.getLogger(GcpLogAlertPublisher.class);

    public static final String LOG_MARKER = "SPORTSHUB_ALERT_SUMMARY";

    @Override
    public boolean publish(String summary) {
        if (summary == null || summary.isBlank()) {
            logger.warn("Skipping GCP alert log; summary was blank");
            return false;
        }
        logger.info("{} {}", LOG_MARKER, summary);
        return true;
    }
}
