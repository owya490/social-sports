package com.functions.smoke.models;

import java.util.LinkedHashMap;
import java.util.Map;

public class SmokeRunResponse {
    public String runId;
    public String runMarker;
    public String status;
    public String failedStep;
    public long durationMs;
    public Long homeLoadMs;
    public String orderId;
    public String cleanupStatus;
    public String error;

    public Map<String, Object> toLogMap() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("runId", runId);
        map.put("runMarker", runMarker);
        map.put("status", status);
        map.put("failedStep", failedStep);
        map.put("durationMs", durationMs);
        map.put("homeLoadMs", homeLoadMs);
        map.put("orderId", orderId);
        map.put("cleanupStatus", cleanupStatus);
        map.put("error", error);
        return map;
    }
}
