package com.functions.utils.logging;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import com.google.cloud.functions.HttpRequest;

public class RequestLogContext implements AutoCloseable {
    private static final ThreadLocal<RequestLogContext> CURRENT = new ThreadLocal<>();

    private final Map<String, String> fields = new LinkedHashMap<>();

    private RequestLogContext() {
    }

    public static RequestLogContext fromHttpRequest(String functionName, HttpRequest request) {
        RequestLogContext context = new RequestLogContext()
                .withField("requestId", extractRequestId(request))
                .withField("functionName", functionName)
                .withField("method", request.getMethod())
                .withField("uri", request.getUri());

        extractCloudTraceId(request).ifPresent(traceId -> context.withField("traceId", traceId));
        return context;
    }

    public static RequestLogContext current() {
        RequestLogContext context = CURRENT.get();
        if (context != null) {
            return context;
        }
        return new RequestLogContext().withField("requestId", "none");
    }

    public RequestLogContext activate() {
        CURRENT.set(this);
        return this;
    }

    public RequestLogContext withField(String key, Object value) {
        if (key == null || key.isBlank() || value == null) {
            return this;
        }

        String valueString = String.valueOf(value);
        if (!valueString.isBlank()) {
            fields.put(key, valueString);
        }
        return this;
    }

    public String field(String key) {
        return fields.get(key);
    }

    public String format(Object... keyValues) {
        Map<String, String> mergedFields = new LinkedHashMap<>(fields);
        mergeKeyValues(mergedFields, keyValues);

        return formatFields(mergedFields);
    }

    public String formatWithFields(Map<String, ?> extraFields, Object... keyValues) {
        Map<String, String> mergedFields = new LinkedHashMap<>(fields);
        if (extraFields != null) {
            for (Map.Entry<String, ?> entry : extraFields.entrySet()) {
                Object value = entry.getValue();
                if (entry.getKey() != null && value != null) {
                    String keyString = entry.getKey();
                    String valueString = String.valueOf(value);
                    if (!keyString.isBlank() && !valueString.isBlank()) {
                        mergedFields.put(keyString, valueString);
                    }
                }
            }
        }
        mergeKeyValues(mergedFields, keyValues);

        return formatFields(mergedFields);
    }

    @Override
    public void close() {
        CURRENT.remove();
    }

    private static void mergeKeyValues(Map<String, String> mergedFields, Object... keyValues) {
        if (keyValues != null) {
            for (int i = 0; i + 1 < keyValues.length; i += 2) {
                Object key = keyValues[i];
                Object value = keyValues[i + 1];
                if (key != null && value != null) {
                    String keyString = String.valueOf(key);
                    String valueString = String.valueOf(value);
                    if (!keyString.isBlank() && !valueString.isBlank()) {
                        mergedFields.put(keyString, valueString);
                    }
                }
            }
        }
    }

    private static String formatFields(Map<String, String> fields) {
        StringBuilder builder = new StringBuilder();
        for (Map.Entry<String, String> entry : fields.entrySet()) {
            if (builder.length() > 0) {
                builder.append(' ');
            }
            builder.append(entry.getKey()).append('=').append(formatValue(entry.getValue()));
        }
        return builder.toString();
    }

    private static String extractRequestId(HttpRequest request) {
        return request.getFirstHeader("X-Request-Id")
                .or(() -> request.getFirstHeader("X-Correlation-Id"))
                .or(() -> request.getFirstHeader("Function-Execution-Id"))
                .filter(value -> !value.isBlank())
                .orElseGet(() -> UUID.randomUUID().toString());
    }

    private static Optional<String> extractCloudTraceId(HttpRequest request) {
        return request.getFirstHeader("X-Cloud-Trace-Context")
                .map(value -> value.split("/", 2)[0])
                .filter(value -> !value.isBlank());
    }

    private static String formatValue(String value) {
        if (value.matches("[A-Za-z0-9._:/@+=,-]+")) {
            return value;
        }
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }
}
