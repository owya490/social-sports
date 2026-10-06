package com.functions.alerts.clients;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.Test;

import com.functions.alerts.models.ParsedErrorLog;
import com.google.cloud.MonitoredResource;
import com.google.cloud.logging.LogEntry;
import com.google.cloud.logging.Payload;
import com.google.cloud.logging.Severity;

public class CloudLoggingNearbyLogFetcherTest {

    @Test
    public void buildFilter_prefersTraceWhenPresent() {
        ParsedErrorLog parsed = new ParsedErrorLog(
                "globalAppController",
                "boom",
                "RuntimeException",
                "WebhookService.process()",
                Instant.parse("2026-10-06T01:00:00Z"),
                "projects/socialsportsprod/traces/abc123");

        String filter = CloudLoggingNearbyLogFetcher.buildFilter(parsed);

        assertTrue(filter.contains("trace=\"projects/socialsportsprod/traces/abc123\""));
        assertFalse(filter.contains("resource.labels.function_name=\"globalAppController\""));
        assertTrue(filter.contains("severity>=INFO"));
        assertTrue(filter.contains("NOT logName:\"sportshub-alert-sms\""));
        assertTrue(filter.contains("NOT textPayload:\"SPORTSHUB_ALERT_SUMMARY\""));
        assertTrue(filter.contains("timestamp>=\"2026-10-06T00:59:45Z\""));
        assertTrue(filter.contains("timestamp<=\"2026-10-06T01:00:05Z\""));
    }

    @Test
    public void buildFilter_usesFunctionAndServiceWhenTraceMissing() {
        ParsedErrorLog parsed = new ParsedErrorLog(
                "send_email_on_purchase",
                "boom",
                "Error",
                "",
                Instant.parse("2026-10-06T01:00:00Z"),
                null);

        String filter = CloudLoggingNearbyLogFetcher.buildFilter(parsed);

        assertTrue(filter.contains("resource.labels.function_name=\"send_email_on_purchase\""));
        assertTrue(filter.contains("resource.labels.service_name=\"send_email_on_purchase\""));
        assertFalse(filter.contains("trace="));
    }

    @Test
    public void fetchNearby_excludesSmsSummaryLogNameAndMarker() {
        List<LogEntry> entries = List.of(
                stringEntry("run.googleapis.com%2Fstdout", Severity.INFO, "Starting checkout"),
                stringEntry("sportshub-alert-sms", Severity.NOTICE, "SPORTSHUB_ALERT_SUMMARY should not appear"),
                stringEntry("run.googleapis.com%2Fstdout", Severity.WARNING, "vacancy low"),
                stringEntry("run.googleapis.com%2Fstdout", Severity.ERROR,
                        "SPORTSHUB_ALERT_KIND=errorSummary hidden"),
                stringEntry("run.googleapis.com%2Fstdout", Severity.ERROR, "RuntimeException: boom"));
        CloudLoggingNearbyLogFetcher fetcher = new CloudLoggingNearbyLogFetcher(filter -> entries);

        List<String> lines = fetcher.fetchNearby(new ParsedErrorLog(
                "globalAppController",
                "boom",
                "RuntimeException",
                "WebhookService.process()",
                Instant.parse("2026-10-06T01:00:00Z"),
                "projects/p/traces/t"));

        assertEquals(List.of(
                "INFO Starting checkout",
                "WARNING vacancy low",
                "ERROR RuntimeException: boom"), lines);
    }

    @Test
    public void cap_keepsLastThirtyAndDropsOldestWhenOverCharBudget() {
        List<String> lines = new ArrayList<>();
        for (int i = 0; i < 40; i++) {
            lines.add("line-" + i);
        }
        List<String> capped = CloudLoggingNearbyLogFetcher.cap(lines);
        assertEquals(30, capped.size());
        assertEquals("line-10", capped.get(0));
        assertEquals("line-39", capped.get(29));

        List<String> huge = List.of("x".repeat(5000), "y".repeat(5000), "z".repeat(5000));
        List<String> trimmed = CloudLoggingNearbyLogFetcher.cap(huge);
        assertEquals(List.of("z".repeat(5000)), trimmed);
    }

    @Test
    public void formatEntry_usesJsonPayloadMessage() {
        LogEntry entry = LogEntry.newBuilder(Payload.JsonPayload.of(Map.of("message", "Organiser missing")))
                .setSeverity(Severity.ERROR)
                .setResource(MonitoredResource.newBuilder("cloud_function").build())
                .build();
        assertEquals("ERROR Organiser missing", CloudLoggingNearbyLogFetcher.formatEntry(entry));
    }

    private static LogEntry stringEntry(String logName, Severity severity, String text) {
        return LogEntry.newBuilder(Payload.StringPayload.of(text))
                .setLogName(logName)
                .setSeverity(severity)
                .setResource(MonitoredResource.newBuilder("global").build())
                .build();
    }
}
