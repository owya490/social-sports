package com.functions.alerts.services;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.regex.Pattern;

import com.functions.alerts.models.ParsedErrorLog;

public final class ErrorAlertFingerprint {
    private static final Pattern UUID = Pattern.compile(
            "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");
    private static final Pattern WEBHOOK_UUID_PREFIX = Pattern.compile(
            "(?i)\\[Webhook-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\\]");
    private static final Pattern FRAME_LOCATION = Pattern.compile("\\([^)]*\\)$");

    private ErrorAlertFingerprint() {
    }

    public static String of(ParsedErrorLog parsed) {
        String seed = String.join("|",
                parsed.functionName(), parsed.exceptionType(), normalizedTopFrame(parsed.topFrame()),
                normalizedFirstLine(parsed.message()));
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(seed.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte value : digest) {
                hex.append(String.format("%02x", value));
            }
            return hex.substring(0, 40);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }

    public static String normalizedFirstLine(String message) {
        String line = message.split("\n", 2)[0];
        line = WEBHOOK_UUID_PREFIX.matcher(line).replaceAll("");
        line = UUID.matcher(line).replaceAll("");
        return line.replaceAll(" +", " ").trim();
    }

    static String normalizedTopFrame(String topFrame) {
        if (topFrame == null || topFrame.isBlank()) {
            return "";
        }
        return FRAME_LOCATION.matcher(topFrame.trim()).replaceFirst("");
    }

}
