package com.functions.alerts.clients;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

import org.junit.Test;

import com.functions.alerts.models.ParsedErrorLog;
import com.google.api.core.ApiFutures;
import com.google.api.gax.paging.AsyncPage;
import com.google.cloud.MonitoredResource;
import com.google.cloud.logging.HttpRequest;
import com.google.cloud.logging.HttpRequest.RequestMethod;
import com.google.cloud.logging.LogEntry;
import com.google.cloud.logging.Logging;
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
    public void fetchNearby_excludesSummarySourcesWhileKeepingApplicationMessages() {
        List<LogEntry> entries = List.of(
                stringEntry("run.googleapis.com%2Fstdout", Severity.INFO, "Starting checkout"),
                stringEntry("sportshub-alert-sms", Severity.NOTICE, "SPORTSHUB_ALERT_SUMMARY should not appear"),
                stringEntry("run.googleapis.com%2Fstdout", Severity.WARNING, "vacancy low"),
                stringEntry("run.googleapis.com%2Fstdout", Severity.ERROR,
                        "SPORTSHUB_ALERT_KIND=errorSummary hidden"),
                stringEntry("run.googleapis.com%2Fstdout", Severity.ERROR, "RuntimeException: boom"));
        CloudLoggingNearbyLogFetcher fetcher = new CloudLoggingNearbyLogFetcher(logging(entries));

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
                "ERROR SPORTSHUB_ALERT_KIND=errorSummary hidden",
                "ERROR RuntimeException: boom"), lines);
    }

    @Test
    public void fetchNearby_preservesHttpOnlyEntriesWithoutCopyingRequestUrls() {
        LogEntry request = LogEntry.newBuilder(null)
                .setSeverity(Severity.WARNING)
                .setHttpRequest(HttpRequest.newBuilder()
                        .setRequestMethod(RequestMethod.GET)
                        .setStatus(400)
                        .setRequestUrl("https://service.example/?token=private")
                        .build())
                .build();
        CloudLoggingNearbyLogFetcher fetcher = new CloudLoggingNearbyLogFetcher(logging(List.of(request)));

        assertEquals(List.of("WARNING HTTP GET status=400"), fetcher.fetchNearby(new ParsedErrorLog(
                "emailService", "Invalid request, unable to process.", "", "")));
    }

    @Test
    public void formatEntry_usesJsonPayloadMessage() {
        LogEntry entry = LogEntry.newBuilder(Payload.JsonPayload.of(Map.of("message", "Organiser missing")))
                .setSeverity(Severity.ERROR)
                .setResource(MonitoredResource.newBuilder("cloud_function").build())
                .build();
        assertEquals("ERROR Organiser missing", CloudLoggingNearbyLogFetcher.formatEntry(entry));
    }

    @Test
    public void fetchNearby_readsOneNewestFirstPageAndReturnsBoundedChronologicalContext() {
        ParsedErrorLog parsed = new ParsedErrorLog("emailService", "failed", "", "", Instant.EPOCH, null);
        for (int width : List.of(10, 350)) {
            List<LogEntry> entries = IntStream.range(0, 100)
                    .mapToObj(i -> stringEntry("stdout", Severity.INFO, "line-" + i + " " + "x".repeat(width))
                            .toBuilder().setTimestamp(Instant.EPOCH.plusSeconds(100 - i)).build())
                    .toList();
            Logging logging = logging(entries);
            List<String> lines = new CloudLoggingNearbyLogFetcher(logging).fetchNearby(parsed);

            assertEquals(width == 10 ? 30 : 22, lines.size());
            assertTrue(String.join("\n", lines).length() <= 8000);
            for (int i = 0; i < lines.size(); i++) {
                assertTrue(lines.get(i).startsWith("INFO line-" + (lines.size() - 1 - i) + " "));
            }
            verify(logging).listLogEntriesAsync(
                    Logging.EntryListOption.filter(CloudLoggingNearbyLogFetcher.buildFilter(parsed)),
                    Logging.EntryListOption.sortOrder(Logging.SortingField.TIMESTAMP, Logging.SortingOrder.DESCENDING),
                    Logging.EntryListOption.pageSize(100));
        }
    }

    @SuppressWarnings("unchecked")
    private static Logging logging(List<LogEntry> entries) {
        Logging logging = mock(Logging.class);
        AsyncPage<LogEntry> page = mock(AsyncPage.class);
        when(page.getValues()).thenReturn(entries);
        when(logging.listLogEntriesAsync(any(Logging.EntryListOption[].class)))
                .thenReturn(ApiFutures.immediateFuture(page));
        return logging;
    }

    private static LogEntry stringEntry(String logName, Severity severity, String text) {
        return LogEntry.newBuilder(Payload.StringPayload.of(text))
                .setLogName(logName)
                .setSeverity(severity)
                .setResource(MonitoredResource.newBuilder("global").build())
                .build();
    }
}
