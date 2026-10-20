package com.functions.global.models;

import com.functions.global.exceptions.AuthenticationException;
import com.functions.partners.models.PartnerContext;

/**
 * Authentication details established for the current request.
 */
public record AuthContext(AuthLevel level, String uid, PartnerContext partnerContext) {
    public AuthContext {
        if (level == null || switch (level) {
            case PUBLIC -> uid != null || partnerContext != null;
            case AUTHENTICATED -> uid == null || uid.isBlank() || partnerContext != null;
            case PARTNER -> uid != null || partnerContext == null;
        }) {
            throw new IllegalArgumentException("Invalid authentication context");
        }
    }

    public static AuthContext anonymous() {
        return new AuthContext(AuthLevel.PUBLIC, null, null);
    }

    public static AuthContext authenticated(String uid) {
        return new AuthContext(AuthLevel.AUTHENTICATED, uid, null);
    }

    public static AuthContext partner(PartnerContext partnerContext) {
        return new AuthContext(AuthLevel.PARTNER, null, partnerContext);
    }

    public PartnerContext requirePartner() {
        if (level != AuthLevel.PARTNER) {
            throw new AuthenticationException("Partner identity is required");
        }
        return partnerContext;
    }

    /**
     * Throws {@link AuthenticationException} (401) rather than
     * {@link IllegalStateException} (500) so that a handler requiring stronger auth
     * than its {@link AuthLevel} declares fails closed with a correct status code
     * instead of surfacing as an internal server error.
     */
    public String requireUid() {
        if (level != AuthLevel.AUTHENTICATED) {
            throw new AuthenticationException("Authenticated user is required");
        }
        return uid;
    }
}
