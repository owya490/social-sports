package com.functions.auth.models;

// TODO: Replace or expand this request context when generalized GlobalAppController auth lands.
public record RequestContext(AuthenticatedUser authenticatedUser) {
    public boolean isAuthenticated() {
        return authenticatedUser != null && authenticatedUser.uid() != null && !authenticatedUser.uid().isBlank();
    }

    public String getAuthenticatedUid() {
        return authenticatedUser != null ? authenticatedUser.uid() : null;
    }
}
