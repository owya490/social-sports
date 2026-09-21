package com.functions.alerts.services;

public final class SmsText {
    public static final int MAX_CHARS = 320;

    private SmsText() {
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
}
