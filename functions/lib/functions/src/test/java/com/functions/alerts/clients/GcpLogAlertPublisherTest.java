package com.functions.alerts.clients;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.util.ArrayList;
import java.util.List;

import org.junit.Test;

import com.google.cloud.logging.LogEntry;
import com.google.cloud.logging.Payload;
import com.google.cloud.logging.Severity;

public class GcpLogAlertPublisherTest {

    @Test
    public void formatPayload_includesKindAndSummaryMarkers() {
        String payload = GcpLogAlertPublisher.formatPayload("globalAppController failed");
        assertTrue(payload.contains(GcpLogAlertPublisher.KIND_MARKER));
        assertTrue(payload.contains(GcpLogAlertPublisher.LOG_MARKER));
        assertTrue(payload.contains("globalAppController failed"));
    }

    @Test
    public void buildEntry_isNoticeTextPayloadOnDedicatedLog() {
        LogEntry entry = GcpLogAlertPublisher.buildEntry(
                GcpLogAlertPublisher.formatPayload("body"),
                "socialsports-44162");

        assertEquals(GcpLogAlertPublisher.LOG_NAME, entry.getLogName());
        assertEquals(Severity.NOTICE, entry.getSeverity());
        assertEquals("global", entry.getResource().getType());
        assertEquals("sms_summary", entry.getLabels().get(GcpLogAlertPublisher.ALERT_LABEL_KEY));
        assertEquals(
                "SPORTSHUB_ALERT_KIND=errorSummary SPORTSHUB_ALERT_SUMMARY body",
                ((Payload.StringPayload) entry.getPayload()).getData());
    }

    @Test
    public void publish_writesTextPayloadAndReturnsTrue() {
        List<LogEntry> written = new ArrayList<>();
        GcpLogAlertPublisher publisher = new GcpLogAlertPublisher(written::add);

        assertTrue(publisher.publish("drill body"));
        assertEquals(1, written.size());
        LogEntry entry = written.get(0);
        assertEquals(Severity.NOTICE, entry.getSeverity());
        assertTrue(((Payload.StringPayload) entry.getPayload()).getData().contains("drill body"));
    }

    @Test
    public void publish_returnsFalseWhenWriterThrows() {
        GcpLogAlertPublisher publisher = new GcpLogAlertPublisher(entry -> {
            throw new IllegalStateException("Cloud Logging client unavailable");
        });
        assertFalse(publisher.publish("body"));
    }

    @Test
    public void publish_skipsBlankSummary() {
        List<LogEntry> written = new ArrayList<>();
        GcpLogAlertPublisher publisher = new GcpLogAlertPublisher(written::add);
        assertFalse(publisher.publish("  "));
        assertTrue(written.isEmpty());
    }
}
