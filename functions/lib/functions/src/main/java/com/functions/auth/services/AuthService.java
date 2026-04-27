package com.functions.auth.services;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.auth.models.AuthenticatedUser;
import com.functions.firebase.services.FirebaseService;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;

public final class AuthService {
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    private static final String BEARER_PREFIX = "Bearer ";

    private AuthService() {
    }

    public static Optional<AuthenticatedUser> authenticateBearerToken(String authorizationHeader) {
        // TODO: Replace this temporary Firebase ID-token verifier with the generalized GlobalAppController auth system.
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            return Optional.empty();
        }

        if (!authorizationHeader.startsWith(BEARER_PREFIX)) {
            logger.warn("Authorization header is not a Bearer token");
            return Optional.empty();
        }

        String idToken = authorizationHeader.substring(BEARER_PREFIX.length()).trim();
        if (idToken.isEmpty()) {
            return Optional.empty();
        }

        try {
            FirebaseService.ensureInitialized();
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            return Optional.of(new AuthenticatedUser(decodedToken.getUid()));
        } catch (FirebaseAuthException e) {
            logger.warn("Failed to verify Firebase ID token: {}", e.getMessage());
            return Optional.empty();
        } catch (Exception e) {
            logger.error("Unexpected error while verifying Firebase ID token", e);
            return Optional.empty();
        }
    }
}
