package com.functions.global.services;

import com.functions.firebase.services.FirebaseService;
import com.functions.global.exceptions.AuthenticationException;
import com.functions.global.models.AuthContext;
import com.functions.global.models.AuthLevel;
import com.google.cloud.functions.HttpRequest;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;

public final class AuthService {
    public static final String AUTHORIZATION_HEADER = "Authorization";

    /**
     * When true, every ID token is additionally checked against the Firebase Auth
     * backend for revocation (disabled user, forced sign-out). This costs one extra
     * network round trip per authenticated request; it is enabled because the
     * AUTHENTICATED tier includes operations that capture and cancel payments.
     */
    private static final boolean CHECK_TOKEN_REVOKED = true;

    private AuthService() {
    }

    public static AuthContext verify(HttpRequest request, AuthLevel requiredAuthLevel) {
        return switch (requiredAuthLevel) {
            case PUBLIC -> AuthContext.anonymous();
            case AUTHENTICATED -> AuthContext.authenticated(verifyFirebaseIdToken(request));
        };
    }

    private static String verifyFirebaseIdToken(HttpRequest request) {
        String idToken = extractBearerToken(request);
        // FirebaseAuth needs the default FirebaseApp, which only FirebaseService
        // creates. Auth runs before routing, so on a cold instance nothing else has
        // loaded that class yet.
        FirebaseService.ensureInitialized();
        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken, CHECK_TOKEN_REVOKED);
            return decodedToken.getUid();
        } catch (FirebaseAuthException | IllegalArgumentException e) {
            // verifyIdToken throws FirebaseAuthException for invalid/expired/revoked
            // tokens but IllegalArgumentException for malformed ones. Both are
            // authentication failures (401), not internal errors (500). Anything else
            // (e.g. an uninitialised FirebaseApp) is deliberately left to propagate as
            // a 500 rather than being masked as a bad credential.
            throw new AuthenticationException("Invalid Firebase ID token");
        }
    }

    private static String extractBearerToken(HttpRequest request) {
        String authorization = request.getFirstHeader(AUTHORIZATION_HEADER)
                .orElseThrow(() -> new AuthenticationException("Authorization header is required"));
        if (!authorization.startsWith("Bearer ")) {
            throw new AuthenticationException("Authorization header must use Bearer token");
        }

        String token = authorization.substring("Bearer ".length()).trim();
        if (token.isBlank()) {
            throw new AuthenticationException("Bearer token is required");
        }
        return token;
    }
}
