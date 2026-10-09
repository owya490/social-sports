package com.functions.fulfilment.controllers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import org.junit.Test;

import io.cloudevents.CloudEvent;
import io.cloudevents.core.builder.CloudEventBuilder;
import io.cloudevents.core.data.BytesCloudEventData;

public class ProcessFulfilmentSessionEndpointTest {

    @Test
    public void fulfilmentSessionJson_unwrapsPubSubSession() {
        String session = "{\"id\":\"session-1\",\"type\":\"CHECKOUT\"}";
        String encoded = Base64.getEncoder().encodeToString(session.getBytes(StandardCharsets.UTF_8));
        String pubsub = "{\"message\":{\"data\":\"" + encoded + "\"}}";

        assertEquals(session, ProcessFulfilmentSessionEndpoint.fulfilmentSessionJson(pubsub));
    }

    @Test
    public void fulfilmentSessionJson_passesThroughWhenThereIsNoPubSubData() {
        String session = "{\"id\":\"session-1\"}";
        assertEquals(session, ProcessFulfilmentSessionEndpoint.fulfilmentSessionJson(session));
    }

    @Test
    public void accept_nullEventFailsSoPubSubCanDeadLetterIt() throws Exception {
        try {
            new ProcessFulfilmentSessionEndpoint().accept(null);
            fail("missing CloudEvent should fail the invocation");
        } catch (IllegalStateException e) {
            assertTrue(e.getMessage().contains("no data"));
        }
    }

    @Test
    public void accept_corruptPubSubDataFailsSoPubSubCanDeadLetterIt() throws Exception {
        try {
            new ProcessFulfilmentSessionEndpoint().accept(cloudEvent("{\"message\":{\"data\":\"%%%\"}}"));
            fail("corrupt Pub/Sub payload should fail the invocation");
        } catch (IllegalStateException e) {
            assertTrue(e.getMessage().contains("unwrap"));
        }
    }

    @Test
    public void accept_malformedSessionFailsSoPubSubCanDeadLetterIt() throws Exception {
        try {
            new ProcessFulfilmentSessionEndpoint().accept(cloudEvent("{\"id\":\"session-1\"}"));
            fail("malformed session should fail the invocation");
        } catch (IllegalStateException e) {
            assertTrue(e.getMessage().contains("Malformed"));
        }
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
