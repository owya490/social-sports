package com.functions.alerts.models;

public record ErrorAlertNotification(
        String fingerprint,
        String headline,
        ParsedErrorLog evidence,
        String aiInterpretation) {
}
