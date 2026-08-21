package com.functions.global.models;

import com.functions.global.exceptions.AuthenticationException;

/**
 * Authentication details established for the current request.
 */
public record AuthContext(AuthLevel level, String uid) {
    public static AuthContext anonymous() {
        return new AuthContext(AuthLevel.PUBLIC, null);
    }

    public static AuthContext authenticated(String uid) {
        return new AuthContext(AuthLevel.AUTHENTICATED, uid);
    }

    /**
     * Throws {@link AuthenticationException} (401) rather than
     * {@link IllegalStateException} (500) so that a handler requiring stronger auth
     * than its {@link AuthLevel} declares fails closed with a correct status code
     * instead of surfacing as an internal server error.
     */
    public String requireUid() {
        if (uid == null || uid.isBlank()) {
            throw new AuthenticationException("Authenticated user is required");
        }
        return uid;
    }
}
