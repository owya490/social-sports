package com.functions.alerts.controllers;

import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.alerts.services.CloudLogEntryParser;
import com.functions.alerts.services.ExplainErrorAlertService;
import com.google.cloud.functions.CloudEventsFunction;

import io.cloudevents.CloudEvent;

/**
 * Pub/Sub-triggered function that turns Cloud Logging ERROR entries into a short SMS summary.
 *
 * <p>This function must never log at ERROR: the log sink that feeds it excludes this
 * function by name, and WARN keeps a mistake from paging in a loop.
 */
public class ExplainErrorAlertEndpoint implements CloudEventsFunction {
    private static final Logger logger = LoggerFactory.getLogger(ExplainErrorAlertEndpoint.class);

    private final ExplainErrorAlertService service;

    public ExplainErrorAlertEndpoint() {
        this(ExplainErrorAlertService.fromEnv());
    }

    ExplainErrorAlertEndpoint(ExplainErrorAlertService service) {
        this.service = service;
    }

    @Override
    public void accept(CloudEvent event) {
        try {
            if (event == null || event.getData() == null) {
                logger.warn("explainErrorAlert received CloudEvent with no data");
                return;
            }
            String cloudEventJson = new String(event.getData().toBytes(), StandardCharsets.UTF_8);
            String logEntryJson = CloudLogEntryParser.extractLogEntryJson(cloudEventJson);
            service.processLogEntryJson(logEntryJson);
        } catch (Exception e) {
            logger.warn("Failed to process error alert event: {}", e.getMessage());
        }
    }
}
