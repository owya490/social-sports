package com.functions.payments.completion.handlers;

import com.functions.payments.completion.models.FulfilmentCompletionJob;

public interface FulfilmentCompletionHandler {
    void handle(FulfilmentCompletionJob job) throws Exception;
}
