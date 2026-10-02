package com.functions.alerts.services;

import java.util.regex.Pattern;

/**
 * Light sanitizer so ERROR log lines are not copied into Gemini prompts or SMS.
 */
public final class AlertTextRedactor {
    private static final Pattern EMAIL = Pattern.compile(
            "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
    private static final Pattern STRIPE_OR_SECRET_PREFIX = Pattern.compile(
            "(?i)\\b(?:sk_live|sk_test|pk_live|pk_test|rk_live|rk_test|whsec)_[A-Za-z0-9]+");
    private static final Pattern BEARER = Pattern.compile(
            "(?i)\\b(bearer\\s+)[A-Za-z0-9._\\-+/=]+");
    private static final Pattern JWT = Pattern.compile(
            "eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+");
    private static final Pattern ASSIGNMENT_SECRET = Pattern.compile(
            "(?i)\\b(api[_-]?key|secret|token|password|passwd|authorization)\\s*[:=]\\s*\\S+");
    private static final Pattern GOOGLE_API_KEY = Pattern.compile(
            "\\bAIza[0-9A-Za-z_\\-]{20,}\\b");

    private AlertTextRedactor() {
    }

    public static String redact(String text) {
        if (text == null || text.isBlank()) {
            return text == null ? "" : text;
        }
        String redacted = EMAIL.matcher(text).replaceAll("[REDACTED_EMAIL]");
        redacted = STRIPE_OR_SECRET_PREFIX.matcher(redacted).replaceAll("[REDACTED_SECRET]");
        redacted = BEARER.matcher(redacted).replaceAll("$1[REDACTED_TOKEN]");
        redacted = JWT.matcher(redacted).replaceAll("[REDACTED_JWT]");
        redacted = ASSIGNMENT_SECRET.matcher(redacted).replaceAll("$1=[REDACTED]");
        redacted = GOOGLE_API_KEY.matcher(redacted).replaceAll("[REDACTED_SECRET]");
        return redacted;
    }
}
