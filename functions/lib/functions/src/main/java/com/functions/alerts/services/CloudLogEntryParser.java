package com.functions.alerts.services;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.JsonNode;
import com.functions.alerts.models.ParsedErrorLog;
import com.functions.utils.JavaUtils;

public final class CloudLogEntryParser {
    private static final Logger logger = LoggerFactory.getLogger(CloudLogEntryParser.class);

    public static final String FUNCTION_NAME = "explainErrorAlert";

    private static final Pattern EXCEPTION_TYPE = Pattern.compile(
            "(?:^|\\n)\\s*([\\w.$]*(?:Exception|Error|Throwable))\\s*:");
    private static final Pattern TOP_FRAME = Pattern.compile(
            "\\bat ((?:[\\w.$]+)\\.[\\w$]+\\([^)]*\\))");

    private CloudLogEntryParser() {
    }

    public static Optional<ParsedErrorLog> parse(String logEntryJson) {
        if (logEntryJson == null || logEntryJson.isBlank()) {
            return Optional.empty();
        }

        try {
            JsonNode root = JavaUtils.objectMapper.readTree(logEntryJson);
            String severity = root.path("severity").asText("");
            if (!severity.isBlank() && !isAlertableSeverity(severity)) {
                return Optional.empty();
            }

            String functionName = firstNonBlank(
                    textOrNull(root.path("resource").path("labels").path("function_name")),
                    textOrNull(root.path("resource").path("labels").path("service_name")),
                    "unknown");

            if (isSelf(functionName)) {
                logger.info("Skipping error alert for explainer function itself");
                return Optional.empty();
            }

            String message = extractMessage(root);
            if (message.contains("SPORTSHUB_ALERT_SUMMARY")) {
                logger.info("Skipping already-published alert summary log");
                return Optional.empty();
            }
            if (message.isBlank()) {
                return Optional.empty();
            }

            return Optional.of(new ParsedErrorLog(
                    functionName,
                    message,
                    extractExceptionType(message),
                    extractTopFrame(message)));
        } catch (Exception e) {
            logger.warn("Failed to parse Cloud Logging entry: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public static String extractLogEntryJson(String cloudEventDataJson) {
        if (cloudEventDataJson == null || cloudEventDataJson.isBlank()) {
            return cloudEventDataJson;
        }
        try {
            JsonNode root = JavaUtils.objectMapper.readTree(cloudEventDataJson);
            JsonNode dataNode = root.path("message").path("data");
            if (dataNode.isTextual() && !dataNode.asText().isBlank()) {
                String encoded = dataNode.asText();
                String decoded = decodeMaybeBase64(encoded);
                if (decoded.trim().startsWith("{")) {
                    return decoded;
                }
            }
            return cloudEventDataJson;
        } catch (Exception e) {
            logger.warn("Failed to unwrap Pub/Sub CloudEvent payload: {}", e.getMessage());
            return cloudEventDataJson;
        }
    }

    public static String fingerprint(ParsedErrorLog parsed) {
        String seed = String.join("|",
                nullToEmpty(parsed.functionName()),
                nullToEmpty(parsed.exceptionType()),
                nullToEmpty(parsed.topFrame()),
                firstLine(parsed.message()));
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(seed.getBytes(StandardCharsets.UTF_8));
            return toHex(digest).substring(0, 40);
        } catch (NoSuchAlgorithmException e) {
            return Integer.toHexString(seed.hashCode());
        }
    }

    static boolean isSelf(String functionName) {
        if (functionName == null) {
            return false;
        }
        String compact = functionName.replace("-", "").replace("_", "");
        return compact.equalsIgnoreCase(FUNCTION_NAME);
    }

    private static boolean isAlertableSeverity(String severity) {
        return "ERROR".equalsIgnoreCase(severity)
                || "CRITICAL".equalsIgnoreCase(severity)
                || "ALERT".equalsIgnoreCase(severity)
                || "EMERGENCY".equalsIgnoreCase(severity);
    }

    private static String extractMessage(JsonNode root) {
        String textPayload = root.path("textPayload").asText("");
        JsonNode jsonPayload = root.path("jsonPayload");
        String jsonMessage = jsonPayload.path("message").asText("");
        if (jsonMessage.isBlank() && jsonPayload.isObject() && jsonPayload.size() > 0) {
            jsonMessage = jsonPayload.toString();
        }
        return firstNonBlank(textPayload, jsonMessage);
    }

    static String extractExceptionType(String message) {
        Matcher matcher = EXCEPTION_TYPE.matcher(message);
        if (matcher.find()) {
            String type = matcher.group(1);
            int lastDot = type.lastIndexOf('.');
            return lastDot >= 0 ? type.substring(lastDot + 1) : type;
        }
        return "Error";
    }

    static String extractTopFrame(String message) {
        Matcher matcher = TOP_FRAME.matcher(message);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return "";
    }

    private static String decodeMaybeBase64(String encoded) {
        try {
            return new String(Base64.getDecoder().decode(encoded), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            return encoded;
        }
    }

    private static String textOrNull(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        String value = node.asText();
        return value == null || value.isBlank() ? null : value;
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return "";
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private static String firstLine(String message) {
        if (message == null) {
            return "";
        }
        int newline = message.indexOf('\n');
        return newline >= 0 ? message.substring(0, newline) : message;
    }

    private static String toHex(byte[] bytes) {
        StringBuilder hex = new StringBuilder(bytes.length * 2);
        for (byte value : bytes) {
            hex.append(String.format("%02x", value));
        }
        return hex.toString();
    }
}
