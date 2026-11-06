package com.functions.partners.models;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public record PartnerIntegration(boolean enabled, String organiserId, List<String> allowedOrigins,
        List<String> keyDigests) {
    private static final Set<String> FIELDS = Set.of("enabled", "organiserId", "allowedOrigins", "keyDigests");

    public PartnerIntegration {
        if (organiserId == null || organiserId.isBlank() || !organiserId.equals(organiserId.trim())
                || allowedOrigins == null || allowedOrigins.isEmpty()
                || keyDigests == null || keyDigests.isEmpty() || keyDigests.size() > 2) {
            throw invalidConfiguration();
        }
        allowedOrigins = List.copyOf(allowedOrigins);
        keyDigests = List.copyOf(keyDigests);
        if (new HashSet<>(allowedOrigins).size() != allowedOrigins.size()
                || new HashSet<>(keyDigests).size() != keyDigests.size()
                || allowedOrigins.stream().anyMatch(origin -> origin.isBlank())
                || keyDigests.stream().anyMatch(digest -> !digest.matches("[a-f0-9]{64}"))) {
            throw invalidConfiguration();
        }
    }

    public static PartnerIntegration fromData(Map<String, Object> data) {
        if (data == null || !data.keySet().equals(FIELDS)
                || !(data.get("enabled") instanceof Boolean enabled)
                || !(data.get("organiserId") instanceof String organiserId)) {
            throw invalidConfiguration();
        }
        return new PartnerIntegration(enabled, organiserId,
                stringList(data.get("allowedOrigins")), stringList(data.get("keyDigests")));
    }

    private static List<String> stringList(Object value) {
        if (!(value instanceof List<?> values) || values.stream().anyMatch(item -> !(item instanceof String))) {
            throw invalidConfiguration();
        }
        return values.stream().map(String.class::cast).toList();
    }

    private static IllegalStateException invalidConfiguration() {
        return new IllegalStateException("Invalid partner integration configuration");
    }
}
