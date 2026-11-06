package com.functions.alerts.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.util.Optional;

import org.junit.Test;

import com.functions.alerts.models.ParsedErrorLog;

public class CloudLogEntryParserTest {

    private static final String CALLABLE_GET_REJECTION = """
            {
              "severity": "ERROR",
              "textPayload": "Invalid request, unable to process.",
              "labels": { "deployment-callable": "true" },
              "httpRequest": { "requestMethod": "GET" },
              "sourceLocation": { "function": "_on_call_handler" },
              "resource": {
                "type": "cloud_run_revision",
                "labels": { "service_name": "send-email-on-create-event-v2" }
              }
            }
            """;

    private static final String JAVA_ERROR_LOG = """
            {
              "severity": "ERROR",
              "timestamp": "2026-10-06T01:00:00.123Z",
              "trace": "projects/socialsportsprod/traces/abc123",
              "httpRequest": { "requestMethod": "POST" },
              "textPayload": "ERROR com.functions.stripe.services.WebhookService - Error processing ticket purchase workflow: boom\\njava.lang.RuntimeException: boom\\n\\tat com.functions.stripe.services.WebhookService.process(WebhookService.java:1128)\\n\\tat com.functions.stripe.handlers.StripeWebhookHandler.handleWebhook(StripeWebhookHandler.java:80)\\n",
              "resource": {
                "type": "cloud_run_revision",
                "labels": {
                  "service_name": "globalappcontroller",
                  "location": "australia-southeast1"
                }
              }
            }
            """;

    private static final String PYTHON_ERROR_LOG = """
            {
              "severity": "ERROR",
              "jsonPayload": {
                "message": "Organiser does not exist: organiserId=abc123",
                "labels": {
                  "uuid": "test-uuid"
                }
              },
              "resource": {
                "type": "cloud_function",
                "labels": {
                  "function_name": "send_email_on_purchase"
                }
              }
            }
            """;

    @Test
    public void parse_javaCloudRunError_extractsFunctionStackAndException() {
        ParsedErrorLog parsed = CloudLogEntryParser.parse(JAVA_ERROR_LOG).orElseThrow();

        assertEquals("globalappcontroller", parsed.functionName());
        assertEquals("RuntimeException", parsed.exceptionType());
        assertEquals("com.functions.stripe.services.WebhookService.process(WebhookService.java:1128)",
                parsed.topFrame());
        assertTrue(parsed.message().contains("Error processing ticket purchase workflow"));
        assertEquals("projects/socialsportsprod/traces/abc123", parsed.trace());
        assertEquals("POST", parsed.requestMethod());
        assertEquals(java.time.Instant.parse("2026-10-06T01:00:00.123Z"), parsed.timestamp());
    }

    @Test
    public void parse_pythonJsonPayload_extractsFunctionAndMessage() {
        ParsedErrorLog parsed = CloudLogEntryParser.parse(PYTHON_ERROR_LOG).orElseThrow();

        assertEquals("send_email_on_purchase", parsed.functionName());
        assertEquals("", parsed.exceptionType());
        assertEquals("", parsed.topFrame());
        assertTrue(parsed.message().contains("Organiser does not exist"));
    }

    @Test
    public void parse_skipsKnownCallableGetRejection() {
        assertTrue(CloudLogEntryParser.parse(CALLABLE_GET_REJECTION).isEmpty());
    }

    @Test
    public void parse_keepsErrorsWithoutTheFullCallableGetSignature() {
        for (String log : java.util.List.of(
                CALLABLE_GET_REJECTION.replace("\"GET\"", "\"POST\""),
                CALLABLE_GET_REJECTION.replace("\"true\"", "\"false\""),
                CALLABLE_GET_REJECTION.replace("_on_call_handler", "send_create_event_email_with_loops"),
                CALLABLE_GET_REJECTION.replace("Invalid request, unable to process.", "Loops request failed"),
                CALLABLE_GET_REJECTION.replace("\"requestMethod\": \"GET\"", "\"status\": 500"))) {
            assertTrue(log, CloudLogEntryParser.parse(log).isPresent());
        }
    }

    @Test
    public void parse_skipsExplainerFunction() {
        String log = """
                {
                  "severity": "ERROR",
                  "textPayload": "should not page",
                  "resource": {
                    "labels": {
                      "function_name": "explainErrorAlert"
                    }
                  }
                }
                """;
        assertTrue(CloudLogEntryParser.parse(log).isEmpty());
    }

    @Test
    public void parse_skipsDedicatedSmsSummaryLogName() {
        String log = """
                {
                  "severity": "ERROR",
                  "logName": "projects/socialsports-44162/logs/sportshub-alert-sms",
                  "textPayload": "unrelated",
                  "resource": {
                    "labels": {
                      "function_name": "globalAppController"
                    }
                  }
                }
                """;
        assertTrue(CloudLogEntryParser.parse(log).isEmpty());
    }

    @Test
    public void parse_keepsApplicationErrorsContainingSummaryMarkers() {
        String log = """
                {
                  "severity": "ERROR",
                  "textPayload": "SPORTSHUB_ALERT_SUMMARY globalAppController: boom",
                  "resource": {
                    "labels": {
                      "function_name": "globalAppController"
                    }
                  }
                }
                """;
        assertTrue(CloudLogEntryParser.parse(log).isPresent());
    }

    @Test
    public void parse_preservesHttpOnlyErrorsAndSourceIdentity() {
        ParsedErrorLog parsed = CloudLogEntryParser.parse("""
                {
                  "severity": "ERROR", "insertId": "source-entry",
                  "logName": "projects/test/logs/run.googleapis.com%2Frequests",
                  "httpRequest": { "requestMethod": "POST", "status": 500 },
                  "resource": { "labels": { "service_name": "emailService" } }
                }
                """).orElseThrow();
        assertEquals("HTTP POST status=500", parsed.message());
        assertEquals(Integer.valueOf(500), parsed.httpStatus());
        assertEquals("source-entry", parsed.insertId());
        assertEquals("projects/test/logs/run.googleapis.com%2Frequests", parsed.logName());
    }

    @Test
    public void parse_doesNotSerializeUnrelatedStructuredFields() {
        ParsedErrorLog parsed = CloudLogEntryParser.parse("""
                {
                  "severity": "ERROR",
                  "jsonPayload": { "error": "Request failed", "password": "synthetic-secret" },
                  "resource": { "labels": { "service_name": "emailService" } }
                }
                """).orElseThrow();
        assertEquals("Request failed", parsed.message());
    }

    @Test
    public void parse_skipsMissingSeverity() {
        String log = """
                {
                  "textPayload": "Cannot checkout: vacancy",
                  "resource": {
                    "labels": {
                      "function_name": "globalAppController"
                    }
                  }
                }
                """;
        assertTrue(CloudLogEntryParser.parse(log).isEmpty());
    }

    @Test
    public void parse_skipsNoticeAndInfoSeverity() {
        String notice = """
                {
                  "severity": "NOTICE",
                  "textPayload": "Cannot checkout: vacancy",
                  "resource": {
                    "labels": {
                      "function_name": "globalAppController"
                    }
                  }
                }
                """;
        String info = """
                {
                  "severity": "INFO",
                  "textPayload": "Cannot checkout: vacancy",
                  "resource": {
                    "labels": {
                      "function_name": "globalAppController"
                    }
                  }
                }
                """;
        assertTrue(CloudLogEntryParser.parse(notice).isEmpty());
        assertTrue(CloudLogEntryParser.parse(info).isEmpty());
    }

    @Test
    public void parse_skipsWarningSeverity() {
        String log = """
                {
                  "severity": "WARNING",
                  "textPayload": "Cannot checkout: vacancy",
                  "resource": {
                    "labels": {
                      "function_name": "globalAppController"
                    }
                  }
                }
                """;
        assertTrue(CloudLogEntryParser.parse(log).isEmpty());
    }

    @Test
    public void extractLogEntryJson_decodesPubSubWrapper() {
        String logEntry = "{\"severity\":\"ERROR\",\"textPayload\":\"boom\",\"resource\":{\"labels\":{\"function_name\":\"globalAppController\"}}}";
        String encoded = java.util.Base64.getEncoder()
                .encodeToString(logEntry.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        String cloudEvent = "{\"message\":{\"data\":\"" + encoded + "\"}}";

        String extracted = CloudLogEntryParser.extractLogEntryJson(cloudEvent);
        Optional<ParsedErrorLog> parsed = CloudLogEntryParser.parse(extracted);

        assertEquals("globalAppController", parsed.orElseThrow().functionName());
        assertTrue(parsed.get().message().contains("boom"));
    }

    @Test
    public void parse_objectTimestampOutOfRange_keepsAlertWithNullTimestamp() {
        String log = """
                {
                  "severity": "ERROR",
                  "timestamp": { "seconds": 999999999999999999, "nanos": 0 },
                  "textPayload": "boom",
                  "resource": {
                    "labels": {
                      "function_name": "globalAppController"
                    }
                  }
                }
                """;
        ParsedErrorLog parsed = CloudLogEntryParser.parse(log).orElseThrow();
        assertEquals("globalAppController", parsed.functionName());
        assertTrue(parsed.message().contains("boom"));
        assertEquals(null, parsed.timestamp());
    }
}
