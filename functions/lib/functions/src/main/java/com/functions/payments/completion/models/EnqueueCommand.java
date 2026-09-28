package com.functions.payments.completion.models;

import java.util.Map;

public record EnqueueCommand(
        String provider,
        String paymentRef,
        FulfilmentCompletionJobType type,
        String fulfilmentSessionId,
        String paymentEntityId,
        Map<String, Object> payload) {
}
