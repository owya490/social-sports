package com.functions.alerts.services;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

public final class SmsText {
    /**
     * Longer AI interpretation stored on the log for Logs Explorer / email.
     * Live SMS uses {@link #forSmsSubject} at {@link #MAX_UTF8_BYTES}.
     */
    public static final int MAX_CHARS = 480;
    /** Cloud Monitoring documentation.subject / jsonPayload.sms is limited to 255 UTF-8 bytes. */
    public static final int MAX_UTF8_BYTES = 255;
    private static final double MIN_BOUNDARY_RATIO = 0.6;
    private static final String[] ABBREVIATIONS = {"e.g.", "i.e.", "vs."};

    private SmsText() {
    }

    /** Paging body: complete sentences that fit {@link #MAX_CHARS}. */
    public static String forSms(String text) {
        return trimToCompleteChars(text, MAX_CHARS, true);
    }

    /**
     * Complete-sentence trim for AI prose in documentation.subject / jsonPayload.sms.
     * Any complete sentence that fits the 255-byte budget is kept.
     */
    public static String forSmsSubject(String text) {
        return trimToCompleteUtf8(text, MAX_UTF8_BYTES, true);
    }

    /**
     * Factual headline trim: keep a sentence or word only when it uses most of
     * the budget; otherwise cut a spaceless blob with an ellipsis.
     */
    public static String forHeadline(String text) {
        return trimToCompleteUtf8(text, MAX_UTF8_BYTES, false);
    }

    public static String truncate(String text) {
        return truncate(text, MAX_CHARS);
    }

    /** Plain cut after collapsing whitespace. No sentence or word trimming. */
    public static String truncate(String text, int maxChars) {
        if (text == null) {
            return "";
        }
        String collapsed = collapseWhitespace(text);
        if (maxChars <= 0 || collapsed.length() <= maxChars) {
            return collapsed;
        }
        return collapsed.substring(0, maxChars);
    }

    static String trimToCompleteUtf8(String text, int maxBytes, boolean keepAnyCompleteSentence) {
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
        return applyBoundaries(prefix, collapsed, maxBytes, true, keepAnyCompleteSentence);
    }

    static String collapseWhitespace(String text) {
        return text.replace('\n', ' ').replace('\r', ' ').replaceAll(" +", " ").trim();
    }

    private static String trimToCompleteChars(String text, int maxChars, boolean keepAnyCompleteSentence) {
        if (text == null) {
            return "";
        }
        String collapsed = collapseWhitespace(text);
        if (maxChars <= 0) {
            return "";
        }
        if (collapsed.length() <= maxChars) {
            return collapsed;
        }
        String prefix = collapsed.substring(0, maxChars);
        return applyBoundaries(prefix, collapsed, maxChars, false, keepAnyCompleteSentence);
    }

    /**
     * AI prose keeps any complete sentence in budget. Headlines require a
     * sentence or word to use most of the budget; otherwise mid-word ellipsis.
     */
    static String applyBoundaries(String prefix, String original, int maxUnits, boolean utf8,
            boolean keepAnyCompleteSentence) {
        int minKeep = (int) Math.ceil(maxUnits * MIN_BOUNDARY_RATIO);
        int sentenceEnd = lastSentenceEnd(prefix, original);
        if (sentenceEnd > 0) {
            String sentence = prefix.substring(0, sentenceEnd).trim();
            if (keepAnyCompleteSentence || units(sentence, utf8) >= minKeep) {
                return sentence;
            }
        }
        int wordEnd = lastWordEnd(prefix, original);
        if (wordEnd > 0 && units(prefix.substring(0, wordEnd), utf8) >= minKeep) {
            return prefix.substring(0, wordEnd).trim();
        }
        return midWord(original, maxUnits, utf8);
    }

    private static String midWord(String original, int maxUnits, boolean utf8) {
        int ellipsisUnits = 3;
        int keep = Math.max(0, maxUnits - ellipsisUnits);
        String prefix = utf8 ? prefixUtf8(original, keep) : original.substring(0, Math.min(keep, original.length()));
        return prefix + "...";
    }

    private static int units(String text, boolean utf8) {
        return utf8 ? utf8Length(text) : text.length();
    }

    /**
     * Sentence boundaries use the next character on {@code original}, not the
     * trimmed prefix. A cut on {@code WebhookService.} is not a sentence end
     * when the original continues with {@code process}.
     */
    private static int lastSentenceEnd(String prefix, String original) {
        int last = -1;
        for (int i = 0; i < prefix.length(); i++) {
            char c = prefix.charAt(i);
            if (c != '.' && c != '!' && c != '?') {
                continue;
            }
            if (i == 0 || !Character.isLetterOrDigit(prefix.charAt(i - 1))) {
                continue;
            }
            if (c == '.' && isAbbreviationPeriod(prefix, i)) {
                continue;
            }
            boolean endOfOriginal = i == original.length() - 1;
            boolean followedBySpace = i + 1 < original.length() && Character.isWhitespace(original.charAt(i + 1));
            boolean nextIsLetter = i + 1 < original.length() && Character.isLetter(original.charAt(i + 1));
            if (nextIsLetter) {
                continue;
            }
            if (endOfOriginal || followedBySpace) {
                last = i + 1;
            }
        }
        return last;
    }

    private static boolean isAbbreviationPeriod(String text, int periodIndex) {
        String upTo = text.substring(0, periodIndex + 1).toLowerCase(Locale.ROOT);
        for (String abbrev : ABBREVIATIONS) {
            if (upTo.endsWith(abbrev)) {
                int start = upTo.length() - abbrev.length();
                if (start == 0 || !Character.isLetterOrDigit(upTo.charAt(start - 1))) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * If the cut already lands on the end of a word (next original char is
     * space or end), keep that word.
     */
    static int lastWordEnd(String prefix, String original) {
        int end = prefix.length();
        while (end > 0 && Character.isWhitespace(prefix.charAt(end - 1))) {
            end--;
        }
        if (end == 0) {
            return 0;
        }
        if (end == original.length() || Character.isWhitespace(original.charAt(end))) {
            return end;
        }
        int i = end - 1;
        while (i >= 0 && !Character.isWhitespace(prefix.charAt(i))) {
            i--;
        }
        while (i >= 0 && Character.isWhitespace(prefix.charAt(i))) {
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
