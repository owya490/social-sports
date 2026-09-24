package com.functions.payments.controllers;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.global.controllers.AbstractConfiguredHttpFunction;
import com.functions.global.models.responses.ErrorResponse;
import com.functions.payments.completion.handlers.FulfilmentCompletionHandlerRegistry;
import com.functions.payments.completion.models.EnqueueCommand;
import com.functions.payments.completion.models.EnqueueOutcome;
import com.functions.payments.completion.models.FulfilmentCompletionJobType;
import com.functions.payments.completion.models.ProcessDueSummary;
import com.functions.payments.completion.models.ProcessJobOutcome;
import com.functions.payments.completion.repositories.FirestoreFulfilmentCompletionJobRepository;
import com.functions.payments.completion.services.FulfilmentCompletionQueue;
import com.functions.payments.completion.services.FulfilmentCompletionWorker;
import com.functions.utils.JavaUtils;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

/**
 * Durable fulfilment-completion queue HTTP surface.
 *
 * <p>GET {@code ?action=enqueue} writes a {@code provider=test} job and processes it (manual
 * test). GET with no action, or {@code ?action=process}, drains due jobs (cron).
 */
public class FulfilmentCompletionJobsEndpoint extends AbstractConfiguredHttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(FulfilmentCompletionJobsEndpoint.class);
    private static final String TEST_PROVIDER = "test";

    private final FulfilmentCompletionQueue queue;
    private final FulfilmentCompletionWorker worker;

    public FulfilmentCompletionJobsEndpoint() {
        this(new FulfilmentCompletionQueue(new FirestoreFulfilmentCompletionJobRepository()),
                new FulfilmentCompletionWorker(
                        new FirestoreFulfilmentCompletionJobRepository(),
                        FulfilmentCompletionHandlerRegistry.noOp()));
    }

    FulfilmentCompletionJobsEndpoint(FulfilmentCompletionQueue queue, FulfilmentCompletionWorker worker) {
        this.queue = queue;
        this.worker = worker;
    }

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        response.appendHeader("Access-Control-Allow-Origin", "*");
        response.appendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.appendHeader("Access-Control-Max-Age", "3600");
        response.appendHeader("Content-Type", "application/json; charset=UTF-8");

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatusCode(204);
            return;
        }

        if (!request.getMethod().equalsIgnoreCase("GET")) {
            response.setStatusCode(405);
            response.appendHeader("Allow", "GET");
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse("The FulfilmentCompletionJobsEndpoint only supports GET requests.")));
            return;
        }

        try {
            String action = query(request, "action").orElse("process");
            if ("enqueue".equalsIgnoreCase(action)) {
                handleEnqueue(request, response);
                return;
            }
            if ("process".equalsIgnoreCase(action)) {
                handleProcess(response);
                return;
            }
            response.setStatusCode(400);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse("Unknown action. Use action=enqueue or action=process.")));
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid fulfilment completion jobs request: {}", e.getMessage());
            response.setStatusCode(400);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(new ErrorResponse(e.getMessage())));
        } catch (Exception e) {
            logger.error("Fulfilment completion jobs endpoint failed", e);
            response.setStatusCode(500);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse("Internal server error")));
        }
    }

    private void handleEnqueue(HttpRequest request, HttpResponse response) throws Exception {
        String paymentRef = query(request, "paymentRef").orElse("manual-" + UUID.randomUUID());
        FulfilmentCompletionJobType type = parseType(query(request, "type").orElse("SUCCESS"));
        EnqueueCommand command = new EnqueueCommand(
                TEST_PROVIDER,
                paymentRef,
                type,
                query(request, "fulfilmentSessionId").orElse(null),
                query(request, "paymentEntityId").orElse(null),
                Map.of("source", "manual-http"));

        logger.info("Manual fulfilment completion enqueue type={} paymentRef={}", type, paymentRef);
        EnqueueOutcome enqueued = queue.enqueue(command);
        ProcessJobOutcome processed = worker.processJob(enqueued.jobId());

        response.setStatusCode(200);
        response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(Map.of(
                "action", "enqueue",
                "enqueue", enqueued,
                "process", processed)));
    }

    private void handleProcess(HttpResponse response) throws Exception {
        ProcessDueSummary summary = worker.processDueJobs(FulfilmentCompletionWorker.DEFAULT_PROCESS_LIMIT);
        response.setStatusCode(200);
        response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(Map.of(
                "action", "process",
                "processed", summary.processed(),
                "skipped", summary.skipped(),
                "failed", summary.failed(),
                "jobs", summary.jobs())));
    }

    private static Optional<String> query(HttpRequest request, String name) {
        List<String> values = request.getQueryParameters().get(name);
        if (values == null || values.isEmpty()) {
            return Optional.empty();
        }
        String value = values.get(0);
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        return Optional.of(value);
    }

    private static FulfilmentCompletionJobType parseType(String raw) {
        try {
            return FulfilmentCompletionJobType.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown job type: " + raw);
        }
    }
}
