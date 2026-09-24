package com.functions.alerts.models;

public record ParsedErrorLog(
        String functionName,
        String message,
        String exceptionType,
        String topFrame) {
}
