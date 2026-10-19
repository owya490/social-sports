package com.functions.partners.models;

public record PartnerContext(String integrationId, String organiserId, String verifiedOrigin) {
    public PartnerContext {
        if (integrationId == null || integrationId.isBlank()
                || organiserId == null || organiserId.isBlank()
                || verifiedOrigin == null || verifiedOrigin.isBlank()) {
            throw new IllegalArgumentException("Partner identity is required");
        }
    }
}
