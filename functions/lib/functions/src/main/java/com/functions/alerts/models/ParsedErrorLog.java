package com.functions.alerts.models;

import java.time.Instant;

public record ParsedErrorLog(
        String functionName,
        String message,
        String exceptionType,
        String topFrame,
        Instant timestamp,
        String trace) {

    public ParsedErrorLog(String functionName, String message, String exceptionType, String topFrame) {
        this(functionName, message, exceptionType, topFrame, null, null);
    }
}
