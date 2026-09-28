package com.functions.payments.completion.handlers;

import java.util.EnumMap;
import java.util.Map;

import com.functions.payments.completion.models.FulfilmentCompletionJobType;

public final class FulfilmentCompletionHandlerRegistry {
    private final Map<FulfilmentCompletionJobType, FulfilmentCompletionHandler> handlers;

    public FulfilmentCompletionHandlerRegistry(Map<FulfilmentCompletionJobType, FulfilmentCompletionHandler> handlers) {
        this.handlers = Map.copyOf(handlers);
    }

    public static FulfilmentCompletionHandlerRegistry noOp() {
        Map<FulfilmentCompletionJobType, FulfilmentCompletionHandler> handlers =
                new EnumMap<>(FulfilmentCompletionJobType.class);
        for (FulfilmentCompletionJobType type : FulfilmentCompletionJobType.values()) {
            handlers.put(type, job -> {
            });
        }
        return new FulfilmentCompletionHandlerRegistry(handlers);
    }

    public FulfilmentCompletionHandler require(FulfilmentCompletionJobType type) {
        FulfilmentCompletionHandler handler = handlers.get(type);
        if (handler == null) {
            throw new IllegalStateException("No fulfilment completion handler for type " + type);
        }
        return handler;
    }
}
