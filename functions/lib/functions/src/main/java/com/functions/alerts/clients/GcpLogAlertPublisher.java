package com.functions.alerts.clients;

import java.util.Collections;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.firebase.services.FirebaseService;
import com.google.cloud.MonitoredResource;
import com.google.cloud.logging.LogEntry;
import com.google.cloud.logging.Logging;
import com.google.cloud.logging.Payload;
import com.google.cloud.logging.Severity;

/**
 * Pages the AI summary through a dedicated Cloud Logging textPayload entry so
 * the log-based SMS policy can match it. Cloud Run SLF4J INFO lines land in
 * jsonPayload.message and do not open Monitoring incidents. Severity is NOTICE,
 * never ERROR, so this cannot recurse into the ERROR sink.
 */
public class GcpLogAlertPublisher implements AlertSummaryPublisher {
    private static final Logger logger = LoggerFactory.getLogger(GcpLogAlertPublisher.class);

    public static final String LOG_MARKER = "SPORTSHUB_ALERT_SUMMARY";
    public static final String KIND_MARKER = "SPORTSHUB_ALERT_KIND=errorSummary";
    public static final String LOG_NAME = "sportshub-alert-sms";
    public static final String ALERT_LABEL_KEY = "sportshub_alert";
    public static final String ALERT_LABEL_VALUE = "sms_summary";

    @FunctionalInterface
    interface LogEntryWriter {
        void writeAndFlush(LogEntry entry) throws Exception;
    }

    private final LogEntryWriter writer;

    public GcpLogAlertPublisher() {
        this(GcpLogAlertPublisher::writeWithFirebaseLogging);
    }

    GcpLogAlertPublisher(LogEntryWriter writer) {
        this.writer = writer;
    }

    @Override
    public boolean publish(String summary) {
        if (summary == null || summary.isBlank()) {
            logger.warn("Skipping GCP alert log; summary was blank");
            return false;
        }
        String payload = formatPayload(summary);
        logger.info("{}", payload);

        if (writer == null) {
            logger.warn("Cloud Logging writer unavailable; SMS summary was not written as textPayload");
            return false;
        }
        try {
            writer.writeAndFlush(buildEntry(payload, projectId()));
            return true;
        } catch (Exception e) {
            logger.warn("Failed to write Cloud Logging SMS summary: {}", e.getMessage());
            return false;
        }
    }

    private static void writeWithFirebaseLogging(LogEntry entry) throws Exception {
        Logging logging = FirebaseService.getLogging();
        if (logging == null) {
            throw new IllegalStateException("Cloud Logging client unavailable");
        }
        logging.write(Collections.singleton(entry));
        logging.flush();
    }

    static String formatPayload(String summary) {
        return KIND_MARKER + " " + LOG_MARKER + " " + summary;
    }

    static LogEntry buildEntry(String payload, String projectId) {
        return LogEntry.newBuilder(Payload.StringPayload.of(payload))
                .setLogName(LOG_NAME)
                .setSeverity(Severity.NOTICE)
                .setResource(MonitoredResource.newBuilder("global")
                        .addLabel("project_id", projectId == null ? "" : projectId)
                        .build())
                .setLabels(Map.of(ALERT_LABEL_KEY, ALERT_LABEL_VALUE))
                .build();
    }

    private static String projectId() {
        String project = FirebaseService.getFirebaseProject();
        if (project != null && !project.isBlank()) {
            return project;
        }
        String envProject = System.getenv("PROJECT_NAME");
        return envProject == null ? "" : envProject;
    }
}
