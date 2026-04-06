package com.functions.utils;

public final class LogSanitizer {
    private LogSanitizer() {
    }

    public static String redactEmail(String email) {
        if (email == null) {
            return "[redacted-email]";
        }

        String normalizedEmail = email.strip();
        if (normalizedEmail.isEmpty()) {
            return "[redacted-email]";
        }

        int atIndex = normalizedEmail.indexOf('@');
        if (atIndex <= 0 || atIndex == normalizedEmail.length() - 1) {
            return "[redacted-email]";
        }

        return normalizedEmail.charAt(0) + "***@***";
    }
}
