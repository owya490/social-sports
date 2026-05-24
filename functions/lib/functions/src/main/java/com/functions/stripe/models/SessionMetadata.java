package com.functions.stripe.models;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents metadata attached to a Stripe checkout session.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionMetadata {
    private String eventId;
    private Boolean isPrivate;
    private String fulfilmentSessionId;
    private String endFulfilmentEntityId;

    /**
     * Validates the session metadata.
     * 
     * @throws IllegalArgumentException if any required field is invalid
     */
    private void validate() {
        if (eventId == null || eventId.isBlank()) {
            throw new IllegalArgumentException("Event Id must be provided as a string.");
        }
        if (isPrivate == null) {
            throw new IllegalArgumentException("Is Private must be provided as a boolean.");
        }
        if (fulfilmentSessionId == null || fulfilmentSessionId.isBlank()) {
            throw new IllegalArgumentException("Fulfilment Session Id must be provided as a non-empty string.");
        }
        if (endFulfilmentEntityId == null || endFulfilmentEntityId.isBlank()) {
            throw new IllegalArgumentException("End Fulfilment Entity Id must be provided as a non-empty string.");
        }
    }

    /**
     * Parses session metadata from Stripe session metadata map.
     * Handles string-to-boolean conversion for isPrivate.
     * 
     * @param metadata The metadata map from Stripe
     * @return SessionMetadata instance
     */
    public static SessionMetadata fromStripeMetadata(Map<String, String> metadata) {
        if (metadata == null) {
            throw new IllegalArgumentException("Session metadata cannot be null");
        }

        String isPrivateStr = metadata.get("isPrivate");
        if (isPrivateStr == null) {
            throw new IllegalArgumentException("Is Private must be provided as a boolean.");
        }
        Boolean isPrivate = Boolean.parseBoolean(isPrivateStr);

        SessionMetadata sessionMetadata = SessionMetadata.builder()
            .eventId(metadata.get("eventId"))
            .isPrivate(isPrivate)
            .fulfilmentSessionId(normalizeBlankToNull(metadata.get("fulfilmentSessionId")))
            .endFulfilmentEntityId(normalizeBlankToNull(metadata.get("endFulfilmentEntityId")))
            .build();
        sessionMetadata.validate();
        return sessionMetadata;
    }

    private static String normalizeBlankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value;
    }
}
