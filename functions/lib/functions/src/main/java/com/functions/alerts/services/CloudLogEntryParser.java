package com.functions.alerts.services;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
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
            String message = extractMessage(root);
            JsonNode request = root.path("httpRequest");
            Integer status = request.path("status").canConvertToInt() ? request.path("status").asInt() : null;
            if (message.isBlank() && status != null) {
                message = "HTTP " + request.path("requestMethod").asText("unknown") + " status=" + status;
            }
            if (message.isBlank() || !AlertLogPolicy.isActionable(root)) {
                return Optional.empty();
            }

            String functionName = firstNonBlank(
                    textOrNull(root.path("resource").path("labels").path("function_name")),
                    textOrNull(root.path("resource").path("labels").path("service_name")),
                    "unknown");

            return Optional.of(new ParsedErrorLog(
                    functionName,
                    message,
                    extractExceptionType(message),
                    extractTopFrame(message),
                    parseTimestamp(root),
                    textOrNull(root.path("trace")),
                    request.path("requestMethod").asText(""),
                    status,
                    root.path("logName").asText(""),
                    root.path("insertId").asText("")));
        } catch (Exception e) {
            logger.warn("Failed to parse Cloud Logging entry: {}", e.getClass().getSimpleName());
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
            logger.warn("Failed to unwrap Pub/Sub CloudEvent payload: {}", e.getClass().getSimpleName());
            return cloudEventDataJson;
        }
    }

    static Instant parseTimestamp(JsonNode root) {
        if (root == null) {
            return null;
        }
        JsonNode timestamp = root.get("timestamp");
        if (timestamp == null || timestamp.isNull() || timestamp.isMissingNode()) {
            return null;
        }
        if (timestamp.isTextual()) {
            try {
                return Instant.parse(timestamp.asText());
            } catch (Exception e) {
                return null;
            }
        }
        if (timestamp.isObject() && timestamp.has("seconds")) {
            try {
                return Instant.ofEpochSecond(timestamp.path("seconds").asLong(), timestamp.path("nanos").asLong());
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }

    private static String extractMessage(JsonNode root) {
        String textPayload = root.path("textPayload").asText("");
        JsonNode jsonPayload = root.path("jsonPayload");
        return firstNonBlank(textPayload, AlertTextRedactor.structuredMessage(jsonPayload));
    }

    static String extractExceptionType(String message) {
        Matcher matcher = EXCEPTION_TYPE.matcher(message);
        if (matcher.find()) {
            String type = matcher.group(1);
            int lastDot = type.lastIndexOf('.');
            return lastDot >= 0 ? type.substring(lastDot + 1) : type;
        }
        return "";
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
}
