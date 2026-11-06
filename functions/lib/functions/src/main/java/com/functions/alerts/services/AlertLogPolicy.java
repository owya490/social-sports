package com.functions.alerts.services;

import java.util.Locale;
import java.util.Set;

import com.fasterxml.jackson.databind.JsonNode;

public final class AlertLogPolicy {
    public static final String EXPLAINER_FUNCTION = "explainErrorAlert";
    public static final String SUMMARY_LOG = "sportshub-alert-sms";

    private static final Set<String> ALERT_SEVERITIES = Set.of("ERROR", "CRITICAL", "ALERT", "EMERGENCY");

    private AlertLogPolicy() {
    }

    static boolean isActionable(JsonNode entry) {
        JsonNode resourceLabels = entry.path("resource").path("labels");
        return ALERT_SEVERITIES.contains(entry.path("severity").asText("").toUpperCase(Locale.ROOT))
                && !isExplainer(resourceLabels.path("function_name").asText(""))
                && !isExplainer(resourceLabels.path("service_name").asText(""))
                && !isSummaryLog(entry.path("logName").asText(""))
                && !isCallableGetRejection(entry);
    }

    private static boolean isCallableGetRejection(JsonNode entry) {
        return "Invalid request, unable to process.".equals(entry.path("textPayload").asText(""))
                && "true".equals(entry.path("labels").path("deployment-callable").asText(""))
                && "GET".equals(entry.path("httpRequest").path("requestMethod").asText(""))
                && "_on_call_handler".equals(entry.path("sourceLocation").path("function").asText(""));
    }

    public static boolean isSummaryLog(String logName) {
        return logName != null && (logName.equals(SUMMARY_LOG) || logName.endsWith("/logs/" + SUMMARY_LOG));
    }

    public static boolean isExplainer(String functionName) {
        return functionName != null
                && functionName.replace("-", "").replace("_", "").equalsIgnoreCase(EXPLAINER_FUNCTION);
    }
}
