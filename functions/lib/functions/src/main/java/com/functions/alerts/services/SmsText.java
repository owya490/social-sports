package com.functions.alerts.services;

import java.nio.charset.StandardCharsets;

public final class SmsText {
    /**
     * Optional longer body for documentation.content / log payload.
     * The SMS subject still uses {@link #MAX_UTF8_BYTES}.
     */
    public static final int MAX_CHARS = 480;
    /** Cloud Monitoring documentation.subject is limited to 255 UTF-8 bytes. */
    public static final int MAX_UTF8_BYTES = 255;

    private SmsText() {
    }

    /** Primary SMS line: complete sentences that fit the GCP subject cap. */
    public static String forSms(String text) {
        return trimToCompleteUtf8(text, MAX_UTF8_BYTES);
    }

    /** Same complete-sentence trim as {@link #forSms} for documentation.subject. */
    public static String forSmsSubject(String text) {
        return trimToCompleteUtf8(text, MAX_UTF8_BYTES);
    }

    public static String truncate(String text) {
        return truncate(text, MAX_CHARS);
    }

    public static String truncate(String text, int maxChars) {
        if (text == null) {
            return "";
        }
        String collapsed = collapseWhitespace(text);
        if (maxChars <= 0 || collapsed.length() <= maxChars) {
            return collapsed;
        }
        return trimToCompleteChars(collapsed, maxChars);
    }

    static String trimToCompleteUtf8(String text, int maxBytes) {
        if (text == null) {
            return "";
        }
        String collapsed = collapseWhitespace(text);
        if (maxBytes <= 0) {
            return "";
        }
        if (utf8Length(collapsed) <= maxBytes) {
            return collapsed;
        }
        String prefix = prefixUtf8(collapsed, maxBytes);
        return trimToBoundary(prefix);
    }

    static String collapseWhitespace(String text) {
        return text.replace('\n', ' ').replace('\r', ' ').replaceAll(" +", " ").trim();
    }

    private static String trimToCompleteChars(String collapsed, int maxChars) {
        String prefix = collapsed.substring(0, maxChars);
        return trimToBoundary(prefix);
    }

    /**
     * Prefer the last complete sentence. If none, the last complete word.
     * Never append ellipsis; never return a trailing partial word when a word
     * boundary exists.
     */
    static String trimToBoundary(String prefix) {
        int sentenceEnd = lastSentenceEnd(prefix);
        if (sentenceEnd > 0) {
            return prefix.substring(0, sentenceEnd).trim();
        }
        int wordEnd = lastWordEnd(prefix);
        if (wordEnd > 0) {
            return prefix.substring(0, wordEnd).trim();
        }
        return prefix.trim();
    }

    private static int lastSentenceEnd(String text) {
        int last = -1;
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (c != '.' && c != '!' && c != '?') {
                continue;
            }
            if (i == 0 || !Character.isLetterOrDigit(text.charAt(i - 1))) {
                continue;
            }
            boolean endOfText = i == text.length() - 1;
            boolean followedBySpace = i + 1 < text.length() && Character.isWhitespace(text.charAt(i + 1));
            boolean nextIsLetter = i + 1 < text.length() && Character.isLetter(text.charAt(i + 1));
            if (nextIsLetter) {
                continue;
            }
            if (endOfText || followedBySpace) {
                last = i + 1;
            }
        }
        return last;
    }

    private static int lastWordEnd(String text) {
        int i = text.length() - 1;
        while (i >= 0 && !Character.isWhitespace(text.charAt(i))) {
            i--;
        }
        while (i >= 0 && Character.isWhitespace(text.charAt(i))) {
            i--;
        }
        return i + 1;
    }

    private static int utf8Length(String text) {
        return text.getBytes(StandardCharsets.UTF_8).length;
    }

    private static String prefixUtf8(String text, int maxBytes) {
        int end = 0;
        while (end < text.length()) {
            int next = text.offsetByCodePoints(end, 1);
            if (text.substring(0, next).getBytes(StandardCharsets.UTF_8).length > maxBytes) {
                break;
            }
            end = next;
        }
        return text.substring(0, end);
    }
}
