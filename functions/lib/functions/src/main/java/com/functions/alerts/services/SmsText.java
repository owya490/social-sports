package com.functions.alerts.services;

import java.nio.charset.StandardCharsets;

public final class SmsText {
    /** About three GSM SMS segments. Full body goes in textPayload and documentation.content. */
    public static final int MAX_CHARS = 480;
    /** Cloud Monitoring documentation.subject is limited to 255 UTF-8 bytes. */
    public static final int MAX_UTF8_BYTES = 255;

    private SmsText() {
    }

    public static String forSms(String text) {
        return truncate(text, MAX_CHARS);
    }

    /** Short form for documentation.subject when GCP truncates at 255 UTF-8 bytes. */
    public static String forSmsSubject(String text) {
        return truncateUtf8Bytes(truncate(text, MAX_CHARS), MAX_UTF8_BYTES);
    }

    public static String truncate(String text) {
        return truncate(text, MAX_CHARS);
    }

    public static String truncate(String text, int maxChars) {
        if (text == null) {
            return "";
        }
        String collapsed = text.replace('\n', ' ').replace('\r', ' ').replaceAll(" +", " ").trim();
        if (maxChars <= 0 || collapsed.length() <= maxChars) {
            return collapsed;
        }
        if (maxChars <= 3) {
            return collapsed.substring(0, maxChars);
        }
        return collapsed.substring(0, maxChars - 3) + "...";
    }

    static String truncateUtf8Bytes(String text, int maxBytes) {
        if (text == null) {
            return "";
        }
        byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
        if (maxBytes <= 0 || bytes.length <= maxBytes) {
            return text;
        }
        String ellipsis = "...";
        byte[] ellipsisBytes = ellipsis.getBytes(StandardCharsets.UTF_8);
        int limit = Math.max(0, maxBytes - ellipsisBytes.length);
        int end = 0;
        while (end < text.length()) {
            int next = text.offsetByCodePoints(end, 1);
            int nextBytes = text.substring(0, next).getBytes(StandardCharsets.UTF_8).length;
            if (nextBytes > limit) {
                break;
            }
            end = next;
        }
        return text.substring(0, end) + ellipsis;
    }
}
