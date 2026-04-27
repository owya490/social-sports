package com.functions.global.services;

import java.util.Arrays;

import com.functions.global.exceptions.AuthenticationException;
import com.functions.global.models.AuthContext;
import com.functions.global.models.AuthLevel;
import com.google.cloud.functions.HttpRequest;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;

public final class AuthService {
    public static final String AUTHORIZATION_HEADER = "Authorization";
    public static final String SESSION_SECRET_HEADER = "X-Session-Secret";
    public static final String SESSION_SECRET_COOKIE = "fulfilmentSessionSecret";

    private AuthService() {
    }

    public static AuthContext verify(HttpRequest request, AuthLevel requiredAuthLevel) {
        return switch (requiredAuthLevel) {
            case PUBLIC -> AuthContext.anonymous();
            case SESSION -> AuthContext.session(extractRequiredSessionSecret(request));
            case AUTHENTICATED -> AuthContext.authenticated(verifyFirebaseIdToken(request));
        };
    }

    private static String verifyFirebaseIdToken(HttpRequest request) {
        String idToken = extractBearerToken(request);
        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            return decodedToken.getUid();
        } catch (FirebaseAuthException e) {
            throw new AuthenticationException("Invalid Firebase ID token");
        }
    }

    private static String extractRequiredSessionSecret(HttpRequest request) {
        return request.getFirstHeader(SESSION_SECRET_HEADER)
                .filter(value -> !value.isBlank())
                .or(() -> extractCookie(request, SESSION_SECRET_COOKIE))
                .filter(value -> !value.isBlank())
                .orElseThrow(() -> new AuthenticationException("Session secret is required"));
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

    private static java.util.Optional<String> extractCookie(HttpRequest request, String cookieName) {
        return request.getFirstHeader("Cookie")
                .stream()
                .flatMap(cookieHeader -> Arrays.stream(cookieHeader.split(";")))
                .map(String::trim)
                .map(cookie -> cookie.split("=", 2))
                .filter(parts -> parts.length == 2 && parts[0].equals(cookieName))
                .map(parts -> parts[1])
                .findFirst();
    }
}
