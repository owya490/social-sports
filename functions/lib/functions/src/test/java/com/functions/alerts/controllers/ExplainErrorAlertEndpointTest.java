package com.functions.alerts.controllers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

import org.junit.Test;

import com.functions.alerts.clients.AlertSummaryPublisher;
import com.functions.alerts.services.ExplainErrorAlertService;

import io.cloudevents.CloudEvent;
import io.cloudevents.core.builder.CloudEventBuilder;
import io.cloudevents.core.data.BytesCloudEventData;

public class ExplainErrorAlertEndpointTest {

    @Test
    public void accept_unwrapsPubSubPayloadAndPublishesSummary() {
        RecordingPublisher publisher = new RecordingPublisher();
        ExplainErrorAlertEndpoint endpoint = new ExplainErrorAlertEndpoint(
                new ExplainErrorAlertService(
                        fingerprint -> true,
                        prompt -> Optional.of("Checkout failed: event missing. Open WebhookService."),
                        publisher));

        String logEntry = """
                {
                  "severity": "ERROR",
                  "textPayload": "java.lang.RuntimeException: boom\\n\\tat com.functions.stripe.services.WebhookService.process(WebhookService.java:1)\\n",
                  "resource": { "labels": { "function_name": "globalAppController" } }
                }
                """;
        String encoded = Base64.getEncoder().encodeToString(logEntry.getBytes(StandardCharsets.UTF_8));
        String pubsub = "{\"message\":{\"data\":\"" + encoded + "\"}}";

        CloudEvent event = CloudEventBuilder.v1()
                .withId("1")
                .withSource(URI.create("//pubsub.googleapis.com/projects/test/topics/error-log-alerts"))
                .withType("google.cloud.pubsub.topic.v1.messagePublished")
                .withData("application/json", BytesCloudEventData.wrap(pubsub.getBytes(StandardCharsets.UTF_8)))
                .build();

        endpoint.accept(event);

        assertEquals(1, publisher.bodies.size());
        assertTrue(publisher.bodies.get(0).contains("Checkout failed"));
    }

    @Test
    public void accept_nullEventDoesNotThrow() {
        ExplainErrorAlertEndpoint endpoint = new ExplainErrorAlertEndpoint(
                new ExplainErrorAlertService(
                        fingerprint -> true,
                        prompt -> Optional.of("unused"),
                        summary -> true));
        endpoint.accept(null);
    }

    private static final class RecordingPublisher implements AlertSummaryPublisher {
        private final List<String> bodies = new ArrayList<>();

        @Override
        public boolean publish(String summary) {
            bodies.add(summary);
            return true;
        }
    }
}
