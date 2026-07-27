package com.functions.global.models;

import com.functions.global.exceptions.AuthenticationException;

/**
 * Authentication details established for the current request.
 */
public record AuthContext(AuthLevel level, String uid, String sessionSecret) {
    public static AuthContext anonymous() {
        return new AuthContext(AuthLevel.PUBLIC, null, null);
    }

    public static AuthContext authenticated(String uid) {
        return new AuthContext(AuthLevel.AUTHENTICATED, uid, null);
    }

    public static AuthContext session(String sessionSecret) {
        return new AuthContext(AuthLevel.SESSION, null, sessionSecret);
    }

    /**
     * These throw {@link AuthenticationException} (401) rather than
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

    public String requireSessionSecret() {
        if (sessionSecret == null || sessionSecret.isBlank()) {
            throw new AuthenticationException("Session secret is required");
        }
        return sessionSecret;
    }
}
