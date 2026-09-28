package com.functions.payments.completion.models;

public enum ProcessJobResult {
    PROCESSED,
    SKIPPED_NOT_DUE,
    NOT_FOUND,
    HANDLER_FAILED;
}
