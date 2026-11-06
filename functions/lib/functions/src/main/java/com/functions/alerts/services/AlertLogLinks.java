package com.functions.alerts.services;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import com.functions.alerts.models.ParsedErrorLog;
import com.functions.utils.JavaUtils;

public final class AlertLogLinks {
    private AlertLogLinks() {
    }

    public static String originalLog(String projectId, ParsedErrorLog evidence) {
        String query = "severity>=ERROR";
        if (evidence.logName() != null && !evidence.logName().isBlank()) {
            query += " AND logName=" + quote(evidence.logName());
        } else {
            query += " AND (resource.labels.function_name=" + quote(evidence.functionName())
                    + " OR resource.labels.service_name=" + quote(evidence.functionName()) + ")";
        }
        if (evidence.insertId() != null && !evidence.insertId().isBlank()) {
            query += " AND insertId=" + quote(evidence.insertId());
        }
        if (evidence.timestamp() != null) {
            query += " AND timestamp=" + quote(evidence.timestamp().toString());
        }
        return "https://console.cloud.google.com/logs/query;query="
                + URLEncoder.encode(query, StandardCharsets.UTF_8).replace("+", "%20")
                + ";duration=P7D?project=" + URLEncoder.encode(projectId, StandardCharsets.UTF_8);
    }

    private static String quote(String value) {
        return JavaUtils.objectMapper.getNodeFactory().textNode(value).toString();
    }
}
