package com.functions.alerts.clients;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import com.functions.alerts.models.ErrorAlertNotification;
import com.functions.alerts.models.ParsedErrorLog;
import com.functions.alerts.services.AlertLogLinks;
import com.functions.alerts.services.AlertLogPolicy;
import com.google.cloud.MonitoredResource;
import com.google.cloud.logging.LogEntry;
import com.google.cloud.logging.Logging;
import com.google.cloud.logging.Payload;
import com.google.cloud.logging.Severity;

public class GcpLogAlertPublisher implements AlertSummaryPublisher {
    private final Logging logging;
    private final String projectId;

    public GcpLogAlertPublisher(Logging logging, String projectId) {
        this.projectId = projectId;
        this.logging = logging;
    }

    @Override
    public void publish(ErrorAlertNotification notification) {
        try {
            logging.write(List.of(buildEntry(notification, projectId)));
            logging.flush();
        } catch (Exception failure) {
            throw new IllegalStateException("Failed to publish error alert evidence", failure);
        }
    }

    static LogEntry buildEntry(ErrorAlertNotification notification, String projectId) {
        ParsedErrorLog evidence = notification.evidence();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("kind", "errorSummary");
        payload.put("fingerprint", notification.fingerprint());
        payload.put("headline", notification.headline());
        payload.put("sms", smsBody(notification));
        payload.put("function", evidence.functionName());
        payload.put("observedMessage", evidence.message());
        payload.put("exceptionType", evidence.exceptionType());
        payload.put("topFrame", evidence.topFrame());
        payload.put("httpMethod", evidence.requestMethod());
        if (evidence.httpStatus() != null) {
            payload.put("httpStatus", evidence.httpStatus());
        }
        payload.put("aiInterpretation", notification.aiInterpretation());
        payload.put("aiInterpretationIsUnconfirmed", true);
        payload.put("originalLogUrl", AlertLogLinks.originalLog(projectId, evidence));
        payload.put("sourceLogName", evidence.logName());
        payload.put("sourceInsertId", evidence.insertId());
        if (evidence.timestamp() != null) {
            payload.put("sourceTimestamp", evidence.timestamp().toString());
        }
        String deliveryKey = notification.fingerprint() + "|" + evidence.logName() + "|"
                + evidence.insertId() + "|" + evidence.timestamp();
        LogEntry.Builder entry = LogEntry.newBuilder(Payload.JsonPayload.of(payload))
                .setLogName(AlertLogPolicy.SUMMARY_LOG)
                .setInsertId(UUID.nameUUIDFromBytes(deliveryKey.getBytes(StandardCharsets.UTF_8)).toString())
                .setSeverity(Severity.NOTICE)
                .setResource(MonitoredResource.newBuilder("global").addLabel("project_id", projectId).build());
        if (evidence.timestamp() != null) {
            entry.setTimestamp(evidence.timestamp());
        }
        return entry.build();
    }

    /** Prefer the 480-char AI body for paging; fall back to the 255-byte headline. */
    static String smsBody(ErrorAlertNotification notification) {
        String interpretation = notification.aiInterpretation();
        if (interpretation != null && !interpretation.isBlank()) {
            return interpretation;
        }
        return notification.headline() == null ? "" : notification.headline();
    }
}
