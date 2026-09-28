package com.functions.payments.completion.models;

public final class JobIds {
    private JobIds() {}

    public static String of(String provider, String paymentRef) {
        if (provider == null || provider.isBlank()) {
            throw new IllegalArgumentException("provider is required");
        }
        if (paymentRef == null || paymentRef.isBlank()) {
            throw new IllegalArgumentException("paymentRef is required");
        }
        return sanitize(provider.trim()) + "_" + sanitize(paymentRef.trim());
    }

    static String sanitize(String value) {
        return value.replace('/', '_');
    }
}
