package com.functions.alerts.controllers;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.alerts.clients.CloudLoggingNearbyLogFetcher;
import com.functions.alerts.clients.GcpLogAlertPublisher;
import com.functions.alerts.clients.GeminiClient;
import com.functions.alerts.repositories.ErrorAlertDedupRepository;
import com.functions.alerts.services.CloudLogEntryParser;
import com.functions.alerts.services.ErrorAlertSummarizer;
import com.functions.alerts.services.ExplainErrorAlertService;
import com.google.cloud.functions.CloudEventsFunction;
import com.google.cloud.logging.Logging;
import com.google.cloud.logging.LoggingOptions;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import com.google.api.gax.retrying.RetrySettings;

import io.cloudevents.CloudEvent;

/**
 * Pub/Sub-triggered function that publishes error evidence and optional diagnostic context.
 *
 * <p>This function must never log at ERROR: the log sink that feeds it excludes this
 * function by name, and WARN keeps a mistake from paging in a loop.
 */
public class ExplainErrorAlertEndpoint implements CloudEventsFunction {
    private static final Logger logger = LoggerFactory.getLogger(ExplainErrorAlertEndpoint.class);

    private final ExplainErrorAlertService service;

    public ExplainErrorAlertEndpoint() {
        this(createService());
    }

    private static ExplainErrorAlertService createService() {
        String project = System.getenv("PROJECT_NAME");
        if (project == null || project.isBlank()) {
            throw new IllegalStateException("PROJECT_NAME is required");
        }
        RetrySettings deadlines = RetrySettings.newBuilder()
                .setInitialRetryDelayDuration(Duration.ofMillis(200))
                .setMaxRetryDelayDuration(Duration.ofSeconds(1)).setRetryDelayMultiplier(2)
                .setInitialRpcTimeoutDuration(Duration.ofSeconds(10))
                .setMaxRpcTimeoutDuration(Duration.ofSeconds(10)).setRpcTimeoutMultiplier(1)
                .setTotalTimeoutDuration(Duration.ofSeconds(15)).setMaxAttempts(2).build();
        Logging logging = LoggingOptions.newBuilder().setProjectId(project).setRetrySettings(deadlines).build().getService();
        logging.setWriteSynchronicity(com.google.cloud.logging.Synchronicity.SYNC);
        Firestore firestore = FirestoreOptions.newBuilder().setProjectId(project).build().getService();
        return new ExplainErrorAlertService(
                new ErrorAlertDedupRepository(firestore),
                new ErrorAlertSummarizer(new GeminiClient(project), new CloudLoggingNearbyLogFetcher(logging)),
                new GcpLogAlertPublisher(logging, project));
    }

    ExplainErrorAlertEndpoint(ExplainErrorAlertService service) {
        this.service = service;
    }

    @Override
    public void accept(CloudEvent event) {
        if (event == null || event.getData() == null) {
            logger.warn("explainErrorAlert received CloudEvent with no data");
            return;
        }
        if (event.getTime() != null && event.getTime().toInstant().isBefore(Instant.now().minus(Duration.ofHours(1)))) {
            logger.warn("Discarding expired error alert event id={}", event.getId());
            return;
        }
        String cloudEventJson = new String(event.getData().toBytes(), StandardCharsets.UTF_8);
        String logEntryJson = CloudLogEntryParser.extractLogEntryJson(cloudEventJson);
        service.processLogEntryJson(logEntryJson);
    }
}
