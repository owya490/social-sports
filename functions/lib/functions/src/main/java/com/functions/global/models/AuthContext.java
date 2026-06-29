package com.functions.global.models;

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

    public String requireUid() {
        if (uid == null || uid.isBlank()) {
            throw new IllegalStateException("Authenticated user is required");
        }
        return uid;
    }

    public String requireSessionSecret() {
        if (sessionSecret == null || sessionSecret.isBlank()) {
            throw new IllegalStateException("Session secret is required");
        }
        return sessionSecret;
    }
}
