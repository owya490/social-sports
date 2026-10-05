package com.functions.fulfilment.controllers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

import org.junit.Test;

import io.cloudevents.CloudEvent;
import io.cloudevents.core.builder.CloudEventBuilder;
import io.cloudevents.core.data.BytesCloudEventData;

public class ProcessFulfilmentSessionEndpointTest {

    @Test
    public void accept_unwrapsPubSubSession() throws Exception {
        List<String> seen = new ArrayList<>();
        ProcessFulfilmentSessionEndpoint endpoint = new ProcessFulfilmentSessionEndpoint(seen::add);
        String session = "{\"id\":\"session-1\",\"type\":\"CHECKOUT\"}";
        String encoded = Base64.getEncoder().encodeToString(session.getBytes(StandardCharsets.UTF_8));
        String pubsub = "{\"message\":{\"data\":\"" + encoded + "\"}}";

        endpoint.accept(cloudEvent(pubsub));

        assertEquals(1, seen.size());
        assertTrue(seen.get(0).contains("session-1"));
    }

    @Test
    public void accept_nullEventDoesNotThrow() throws Exception {
        ProcessFulfilmentSessionEndpoint endpoint = new ProcessFulfilmentSessionEndpoint(json -> {
            throw new IllegalStateException("should not process");
        });
        endpoint.accept(null);
    }

    @Test
    public void accept_processorFailurePropagates() throws Exception {
        ProcessFulfilmentSessionEndpoint endpoint = new ProcessFulfilmentSessionEndpoint(json -> {
            throw new IllegalStateException("retry");
        });
        try {
            endpoint.accept(cloudEvent("{\"id\":\"session-1\"}"));
        } catch (IllegalStateException e) {
            assertEquals("retry", e.getMessage());
            return;
        }
        throw new AssertionError("expected processor failure to propagate");
    }

    private static CloudEvent cloudEvent(String data) {
        return CloudEventBuilder.v1()
                .withId("1")
                .withSource(URI.create("//pubsub.googleapis.com/projects/test/topics/process-fulfilment-sessions-topic"))
                .withType("google.cloud.pubsub.topic.v1.messagePublished")
                .withData("application/json", BytesCloudEventData.wrap(data.getBytes(StandardCharsets.UTF_8)))
                .build();
    }
}
