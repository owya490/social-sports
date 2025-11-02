package com.functions.stripe.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents metadata attached to a Stripe checkout session.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SessionMetadata {
    private String eventId;
    private Boolean isPrivate;
    private Boolean completeFulfilmentSession;
    private String fulfilmentSessionId;
    private String endFulfilmentEntityId;

    /**
     * Validates the session metadata.
     * 
     * @throws IllegalArgumentException if any required field is invalid
     */
    public void validate() {
        if (eventId == null || eventId.isEmpty()) {
            throw new IllegalArgumentException("Event Id must be provided as a string.");
        }
        if (isPrivate == null) {
            throw new IllegalArgumentException("Is Private must be provided as a boolean.");
        }
        if (completeFulfilmentSession == null) {
            throw new IllegalArgumentException("Complete Fulfilment Session must be provided as a boolean.");
        }
        if (fulfilmentSessionId != null && fulfilmentSessionId.isEmpty()) {
            throw new IllegalArgumentException("Fulfilment Session Id must be provided as a string or null.");
        }
        if (endFulfilmentEntityId == null || endFulfilmentEntityId.isEmpty()) {
            throw new IllegalArgumentException("End Fulfilment Entity Id must be provided as a string.");
        }
    }

    /**
     * Parses session metadata from Stripe session metadata map.
     * Handles string-to-boolean conversion for isPrivate and completeFulfilmentSession.
     * 
     * @param metadata The metadata map from Stripe
     * @return SessionMetadata instance
     */
    public static SessionMetadata fromStripeMetadata(java.util.Map<String, String> metadata) {
        if (metadata == null) {
            throw new IllegalArgumentException("Session metadata cannot be null");
        }

        SessionMetadata sessionMetadata = new SessionMetadata();
        sessionMetadata.setEventId(metadata.get("eventId"));
        
        // Handle boolean conversion from String
        String isPrivateStr = metadata.get("isPrivate");
        if (isPrivateStr != null) {
            sessionMetadata.setIsPrivate(Boolean.parseBoolean(isPrivateStr));
        }
        
        String completeFulfilmentSessionStr = metadata.get("completeFulfilmentSession");
        if (completeFulfilmentSessionStr != null) {
            sessionMetadata.setCompleteFulfilmentSession(Boolean.parseBoolean(completeFulfilmentSessionStr));
        }
        
        sessionMetadata.setFulfilmentSessionId(metadata.get("fulfilmentSessionId"));
        sessionMetadata.setEndFulfilmentEntityId(metadata.get("endFulfilmentEntityId"));
        
        return sessionMetadata;
    }
}

