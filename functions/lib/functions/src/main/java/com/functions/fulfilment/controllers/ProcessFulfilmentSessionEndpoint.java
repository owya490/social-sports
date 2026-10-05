package com.functions.fulfilment.controllers;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.JsonNode;
import com.functions.fulfilment.services.ProcessFulfilmentSessionService;
import com.functions.utils.JavaUtils;
import com.google.cloud.functions.CloudEventsFunction;

import io.cloudevents.CloudEvent;

/**
 * Pub/Sub consumer for process-fulfilment-sessions-topic.
 * The message body is the fulfilment session. A thrown exception asks Pub/Sub to redeliver.
 */
public class ProcessFulfilmentSessionEndpoint implements CloudEventsFunction {
    private static final Logger logger = LoggerFactory.getLogger(ProcessFulfilmentSessionEndpoint.class);

    private final SessionProcessor processor;

    public ProcessFulfilmentSessionEndpoint() {
        this(new ProcessFulfilmentSessionService()::process);
    }

    ProcessFulfilmentSessionEndpoint(SessionProcessor processor) {
        this.processor = processor;
    }

    @Override
    public void accept(CloudEvent event) throws Exception {
        if (event == null || event.getData() == null) {
            logger.warn("processFulfilmentSession received CloudEvent with no data");
            return;
        }
        String cloudEventJson = new String(event.getData().toBytes(), StandardCharsets.UTF_8);
        processor.process(fulfilmentSessionJson(cloudEventJson));
    }

    static String fulfilmentSessionJson(String cloudEventJson) {
        if (cloudEventJson == null || cloudEventJson.isBlank()) {
            return cloudEventJson;
        }
        try {
            JsonNode dataNode = JavaUtils.objectMapper.readTree(cloudEventJson).path("message").path("data");
            if (dataNode.isTextual() && !dataNode.asText().isBlank()) {
                byte[] decoded = Base64.getDecoder().decode(dataNode.asText());
                return new String(decoded, StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            logger.warn("Failed to unwrap Pub/Sub fulfilment session: {}", e.getMessage());
        }
        return cloudEventJson;
    }

    @FunctionalInterface
    interface SessionProcessor {
        void process(String sessionJson) throws Exception;
    }
}
