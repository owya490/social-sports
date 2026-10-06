package com.functions.alerts.clients;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.alerts.models.ParsedErrorLog;
import com.functions.firebase.services.FirebaseService;
import com.google.cloud.logging.LogEntry;
import com.google.cloud.logging.Logging;
import com.google.cloud.logging.Payload;
import com.google.cloud.logging.Severity;

/**
 * Loads INFO/WARNING/ERROR lines around the triggering ERROR so Gemini can see
 * request context. Summary SMS logs are excluded to avoid recursion.
 */
public class CloudLoggingNearbyLogFetcher implements NearbyLogFetcher {
    private static final Logger logger = LoggerFactory.getLogger(CloudLoggingNearbyLogFetcher.class);

    public static final int MAX_LINES = 30;
    public static final int MAX_CHARS = 8000;
    public static final Duration BEFORE = Duration.ofSeconds(15);
    public static final Duration AFTER = Duration.ofSeconds(5);

    @FunctionalInterface
    interface LogQuery {
        Iterable<LogEntry> list(String filter) throws Exception;
    }

    private final LogQuery query;

    public CloudLoggingNearbyLogFetcher() {
        this(CloudLoggingNearbyLogFetcher::listWithFirebaseLogging);
    }

    CloudLoggingNearbyLogFetcher(LogQuery query) {
        this.query = query;
    }

    @Override
    public List<String> fetchNearby(ParsedErrorLog parsed) {
        if (parsed == null) {
            return List.of();
        }
        String filter = buildFilter(parsed);
        if (filter == null) {
            return List.of();
        }
        List<LogEntry> entries = new ArrayList<>();
        try {
            for (LogEntry entry : query.list(filter)) {
                entries.add(entry);
            }
        } catch (Exception e) {
            throw new IllegalStateException("Cloud Logging nearby query failed", e);
        }
        entries.sort(Comparator.comparing(CloudLoggingNearbyLogFetcher::entryTimestamp));
        List<String> lines = new ArrayList<>();
        for (LogEntry entry : entries) {
            String line = formatEntry(entry);
            if (line.isBlank() || isExcludedText(line) || isExcludedEntry(entry)) {
                continue;
            }
            lines.add(line);
        }
        return cap(lines);
    }

    static String buildFilter(ParsedErrorLog parsed) {
        Instant center = parsed.timestamp() != null ? parsed.timestamp() : Instant.now();
        String start = center.minus(BEFORE).toString();
        String end = center.plus(AFTER).toString();

        StringBuilder filter = new StringBuilder();
        filter.append("severity>=INFO");
        filter.append(" AND timestamp>=\"").append(start).append("\"");
        filter.append(" AND timestamp<=\"").append(end).append("\"");
        filter.append(" AND NOT logName:\"sportshub-alert-sms\"");
        filter.append(" AND NOT textPayload:\"SPORTSHUB_ALERT_SUMMARY\"");
        filter.append(" AND NOT jsonPayload.message:\"SPORTSHUB_ALERT_SUMMARY\"");
        filter.append(" AND NOT resource.labels.function_name=\"explainErrorAlert\"");
        filter.append(" AND NOT resource.labels.service_name=\"explainErrorAlert\"");

        if (parsed.trace() != null && !parsed.trace().isBlank()) {
            filter.append(" AND trace=\"").append(escapeFilterValue(parsed.trace())).append("\"");
            return filter.toString();
        }
        String functionName = parsed.functionName();
        if (functionName == null || functionName.isBlank() || "unknown".equals(functionName)) {
            return null;
        }
        String escaped = escapeFilterValue(functionName);
        filter.append(" AND (resource.labels.function_name=\"")
                .append(escaped)
                .append("\" OR resource.labels.service_name=\"")
                .append(escaped)
                .append("\")");
        return filter.toString();
    }

    public static boolean isExcludedText(String text) {
        if (text == null || text.isBlank()) {
            return true;
        }
        return text.contains("sportshub-alert-sms")
                || text.contains("SPORTSHUB_ALERT_SUMMARY")
                || text.contains("SPORTSHUB_ALERT_KIND=errorSummary");
    }

    static boolean isExcludedEntry(LogEntry entry) {
        if (entry == null) {
            return true;
        }
        String logName = entry.getLogName();
        return logName != null && logName.contains("sportshub-alert-sms");
    }

    static String formatEntry(LogEntry entry) {
        if (entry == null) {
            return "";
        }
        Severity severity = entry.getSeverity();
        String severityLabel = severity == null ? "DEFAULT" : severity.name();
        String payload = payloadText(entry);
        if (payload.isBlank()) {
            return "";
        }
        return severityLabel + " " + payload.strip();
    }

    public static List<String> cap(List<String> lines) {
        if (lines == null || lines.isEmpty()) {
            return List.of();
        }
        int from = Math.max(0, lines.size() - MAX_LINES);
        List<String> recent = new ArrayList<>(lines.subList(from, lines.size()));
        while (!recent.isEmpty() && joinedLength(recent) > MAX_CHARS) {
            recent.remove(0);
        }
        return List.copyOf(recent);
    }

    private static int joinedLength(List<String> lines) {
        int length = 0;
        for (int i = 0; i < lines.size(); i++) {
            if (i > 0) {
                length++;
            }
            length += lines.get(i).length();
        }
        return length;
    }

    private static Instant entryTimestamp(LogEntry entry) {
        if (entry == null || entry.getInstantTimestamp() == null) {
            return Instant.EPOCH;
        }
        return entry.getInstantTimestamp();
    }

    private static String payloadText(LogEntry entry) {
        Payload<?> payload = entry.getPayload();
        if (payload instanceof Payload.StringPayload stringPayload) {
            return stringPayload.getData() == null ? "" : stringPayload.getData();
        }
        if (payload instanceof Payload.JsonPayload jsonPayload) {
            Map<String, Object> data = jsonPayload.getDataAsMap();
            Object message = data.get("message");
            if (message != null && !message.toString().isBlank()) {
                return message.toString();
            }
            return data.isEmpty() ? "" : data.toString();
        }
        return "";
    }

    private static String escapeFilterValue(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private static Iterable<LogEntry> listWithFirebaseLogging(String filter) throws Exception {
        Logging logging = FirebaseService.getLogging();
        if (logging == null) {
            throw new IllegalStateException("Cloud Logging client unavailable");
        }
        return logging.listLogEntries(
                Logging.EntryListOption.filter(filter),
                Logging.EntryListOption.pageSize(50)).iterateAll();
    }
}
