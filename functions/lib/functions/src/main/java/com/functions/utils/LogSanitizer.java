package com.functions.utils;

public final class LogSanitizer {
    private LogSanitizer() {
    }

    public static String redactEmail(String email) {
        if (email == null || email.isBlank()) {
            return "[redacted-email]";
        }

        int atIndex = email.indexOf('@');
        if (atIndex <= 0 || atIndex == email.length() - 1) {
            return "[redacted-email]";
        }

        return email.charAt(0) + "***@***";
    }
}
