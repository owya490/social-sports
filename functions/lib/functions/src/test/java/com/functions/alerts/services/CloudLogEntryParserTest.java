package com.functions.alerts.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.util.Optional;

import org.junit.Test;

import com.functions.alerts.models.ParsedErrorLog;

public class CloudLogEntryParserTest {

    private static final String JAVA_ERROR_LOG = """
            {
              "severity": "ERROR",
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
    }

    @Test
    public void parse_pythonJsonPayload_extractsFunctionAndMessage() {
        ParsedErrorLog parsed = CloudLogEntryParser.parse(PYTHON_ERROR_LOG).orElseThrow();

        assertEquals("send_email_on_purchase", parsed.functionName());
        assertEquals("Error", parsed.exceptionType());
        assertEquals("", parsed.topFrame());
        assertTrue(parsed.message().contains("Organiser does not exist"));
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
    public void parse_skipsPublishedAlertSummary() {
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
        assertTrue(CloudLogEntryParser.parse(log).isEmpty());
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
    public void fingerprint_isStableForSameError() {
        ParsedErrorLog parsed = CloudLogEntryParser.parse(JAVA_ERROR_LOG).orElseThrow();
        String first = CloudLogEntryParser.fingerprint(parsed);
        String second = CloudLogEntryParser.fingerprint(parsed);

        assertEquals(first, second);
        assertEquals(40, first.length());
        assertFalse(CloudLogEntryParser.fingerprint(
                CloudLogEntryParser.parse(PYTHON_ERROR_LOG).orElseThrow()).equals(first));
    }
}
