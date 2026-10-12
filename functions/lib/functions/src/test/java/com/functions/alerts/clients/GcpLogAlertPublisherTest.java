package com.functions.alerts.clients;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import org.junit.Test;
import org.mockito.ArgumentCaptor;

import com.functions.alerts.models.ErrorAlertNotification;
import com.functions.alerts.models.ParsedErrorLog;
import com.google.cloud.logging.LogEntry;
import com.google.cloud.logging.Logging;
import com.google.cloud.logging.Payload;
import com.google.cloud.logging.Severity;

public class GcpLogAlertPublisherTest {
    @Test
    public void publish_writesStructuredEvidenceAndAnExactSourceLink() {
        Logging logging = mock(Logging.class);
        GcpLogAlertPublisher publisher = new GcpLogAlertPublisher(logging, "test");
        publisher.publish(notification());

        ArgumentCaptor<List<LogEntry>> entries = ArgumentCaptor.captor();
        verify(logging).write(entries.capture());
        verify(logging).flush();
        LogEntry entry = entries.getValue().get(0);
        Map<String, Object> payload = ((Payload.JsonPayload) entry.getPayload()).getDataAsMap();
        assertEquals("sportshub-alert-sms", entry.getLogName());
        assertEquals(Severity.NOTICE, entry.getSeverity());
        assertEquals("errorSummary", payload.get("kind"));
        assertEquals("fingerprint", payload.get("fingerprint"));
        assertEquals("emailService: Request rejected", payload.get("headline"));
        assertEquals("Unconfirmed cause", payload.get("sms"));
        assertEquals("Request rejected", payload.get("observedMessage"));
        assertEquals("Unconfirmed cause", payload.get("aiInterpretation"));
        assertEquals(true, payload.get("aiInterpretationIsUnconfirmed"));
        String link = URLDecoder.decode(payload.get("originalLogUrl").toString(), StandardCharsets.UTF_8);
        assertTrue(link.contains("insertId=\"original\""));
        assertTrue(link.contains("logName=\"projects/test/logs/stderr\""));
        assertTrue(link.contains("timestamp=\"2026-10-11T03:00:00Z\""));
        assertTrue(link.endsWith("?project=test"));
        assertEquals(Instant.parse("2026-10-11T03:00:00Z"), entry.getInstantTimestamp());
    }

    @Test
    public void buildEntry_pagesHeadlineWhenAiInterpretationIsMissing() {
        ErrorAlertNotification withoutAi = new ErrorAlertNotification("fingerprint", "emailService: Request rejected",
                new ParsedErrorLog("emailService", "Request rejected", "", ""), "");
        Map<String, Object> payload = ((Payload.JsonPayload) GcpLogAlertPublisher.buildEntry(withoutAi, "test")
                .getPayload()).getDataAsMap();
        assertEquals("emailService: Request rejected", payload.get("sms"));
    }

    @Test
    public void buildEntry_usesTheSameLogIdentityForRedelivery() {
        assertEquals(GcpLogAlertPublisher.buildEntry(notification(), "test").getInsertId(),
                GcpLogAlertPublisher.buildEntry(notification(), "test").getInsertId());
    }

    @Test(expected = IllegalStateException.class)
    public void publish_propagatesWriterFailure() {
        Logging logging = mock(Logging.class);
        doThrow(new IllegalStateException("unavailable")).when(logging).write(any());
        new GcpLogAlertPublisher(logging, "test").publish(notification());
    }

    private static ErrorAlertNotification notification() {
        return new ErrorAlertNotification("fingerprint", "emailService: Request rejected",
                new ParsedErrorLog("emailService", "Request rejected", "", "",
                        Instant.parse("2026-10-11T03:00:00Z"), "", "POST", 400,
                        "projects/test/logs/stderr", "original"), "Unconfirmed cause");
    }
}
