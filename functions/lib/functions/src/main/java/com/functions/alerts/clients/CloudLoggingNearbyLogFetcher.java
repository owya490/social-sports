package com.functions.alerts.clients;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Iterator;
import java.util.concurrent.TimeUnit;

import com.functions.alerts.models.ParsedErrorLog;
import com.functions.alerts.services.AlertLogPolicy;
import com.functions.alerts.services.AlertTextRedactor;
import com.functions.alerts.services.SmsText;
import com.functions.utils.JavaUtils;
import com.google.cloud.logging.HttpRequest;
import com.google.cloud.logging.LogEntry;
import com.google.cloud.logging.Logging;
import com.google.cloud.logging.Payload;
import com.google.cloud.logging.Severity;

/**
 * Loads INFO/WARNING/ERROR lines around the triggering ERROR so Gemini can see
 * request context. Summary SMS logs are excluded to avoid recursion.
 */
public class CloudLoggingNearbyLogFetcher implements NearbyLogFetcher {
    public static final Duration BEFORE = Duration.ofSeconds(15);
    public static final Duration AFTER = Duration.ofSeconds(5);
    static final int MAX_LINES = 30;
    static final int MAX_CHARS = 8000;
    static final int MAX_SCANNED = 100;

    private final Logging logging;

    public CloudLoggingNearbyLogFetcher(Logging logging) {
        this.logging = logging;
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
            Iterator<LogEntry> iterator = logging.listLogEntriesAsync(
                    Logging.EntryListOption.filter(filter),
                    Logging.EntryListOption.sortOrder(Logging.SortingField.TIMESTAMP, Logging.SortingOrder.DESCENDING),
                    Logging.EntryListOption.pageSize(MAX_SCANNED))
                    .get(15, TimeUnit.SECONDS).getValues().iterator();
            int scanned = 0;
            while (scanned < MAX_SCANNED && entries.size() < MAX_LINES && iterator.hasNext()) {
                LogEntry entry = iterator.next();
                scanned++;
                if (entry == null || AlertLogPolicy.isSummaryLog(entry.getLogName())) {
                    continue;
                }
                entries.add(entry);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Cloud Logging nearby query interrupted", e);
        } catch (Exception e) {
            throw new IllegalStateException("Cloud Logging nearby query failed", e);
        }
        entries.sort(Comparator.comparing(CloudLoggingNearbyLogFetcher::entryTimestamp));
        List<String> lines = new ArrayList<>();
        int chars = 0;
        for (LogEntry entry : entries) {
            String line = formatEntry(entry);
            if (line.isBlank()) {
                continue;
            }
            while (!lines.isEmpty() && chars + line.length() + 1 > MAX_CHARS) {
                chars -= lines.remove(0).length() + 1;
            }
            lines.add(line);
            chars += line.length() + 1;
        }
        return lines;
    }

    static String buildFilter(ParsedErrorLog parsed) {
        Instant center = parsed.timestamp() != null ? parsed.timestamp() : Instant.now();
        String start = center.minus(BEFORE).toString();
        String end = center.plus(AFTER).toString();

        StringBuilder filter = new StringBuilder();
        filter.append("severity>=INFO");
        filter.append(" AND timestamp>=\"").append(start).append("\"");
        filter.append(" AND timestamp<=\"").append(end).append("\"");
        filter.append(" AND NOT logName:\"").append(AlertLogPolicy.SUMMARY_LOG).append("\"");
        filter.append(" AND NOT resource.labels.function_name=\"").append(AlertLogPolicy.EXPLAINER_FUNCTION).append("\"");
        filter.append(" AND NOT resource.labels.service_name=\"")
                .append(AlertLogPolicy.EXPLAINER_FUNCTION.toLowerCase(Locale.ROOT)).append("\"");

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

    static String formatEntry(LogEntry entry) {
        if (entry == null) {
            return "";
        }
        Severity severity = entry.getSeverity();
        String severityLabel = severity == null ? "DEFAULT" : severity.name();
        String payload = payloadText(entry);
        HttpRequest request = entry.getHttpRequest();
        if (request != null && request.getRequestMethod() != null) {
            String status = request.getStatus() == null ? "" : " status=" + request.getStatus();
            payload = "HTTP " + request.getRequestMethod() + status + (payload.isBlank() ? "" : " " + payload);
        }
        if (payload.isBlank()) {
            return "";
        }
        return SmsText.truncate(AlertTextRedactor.redact(severityLabel + " " + payload.strip()), 2000);
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
            return AlertTextRedactor.structuredMessage(JavaUtils.objectMapper.valueToTree(data));
        }
        return "";
    }

    private static String escapeFilterValue(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

}
