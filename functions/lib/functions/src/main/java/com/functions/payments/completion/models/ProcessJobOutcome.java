package com.functions.payments.completion.models;

public record ProcessJobOutcome(
        ProcessJobResult result,
        String jobId,
        FulfilmentCompletionJobStatus status,
        String lastError) {
}
