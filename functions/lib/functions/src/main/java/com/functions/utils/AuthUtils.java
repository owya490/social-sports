package com.functions.utils;

import com.functions.FirebaseService;
import com.google.auth.oauth2.TokenVerifier;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import org.slf4j.Logger;

import java.util.Optional;

public class AuthUtils {
    public static void authenticateUserToken(HttpRequest request, HttpResponse response, Logger logger) throws Exception {
        // Extract Authorization header
        Optional<String> maybeAuthHeader = request.getFirstHeader("Authorization");
        if (maybeAuthHeader.isEmpty() || !maybeAuthHeader.get().startsWith("Bearer ")) {
            logger.error("Authorization token missing or malformed.");
            response.setStatusCode(401); // Unauthorized
            response.getWriter().write("Authorization token missing or malformed.");
            throw new Exception("Unauthorized");
        }

        String idToken = maybeAuthHeader.get().substring("Bearer ".length());

        try {
            // Verify the token using Firebase Admin SDK
            FirebaseService.invokeInitialize();
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);

            String uid = decodedToken.getUid();
            logger.info("Authenticated user with UID: {}", uid);
        } catch (Exception e) {
            response.setStatusCode(403);
            response.getWriter().write("Invalid or expired token.");
            throw new Exception("Failed to authenticate user", e);
        }
    }

    // The recurring-events-cron-job Cloud Scheduler emits the OIDC token.
    public static void authenticateOIDCToken(HttpRequest request, HttpResponse response, Logger logger, String cloudRunURL) throws Exception {
        // Extract Authorization header
        Optional<String> maybeAuthHeader = request.getFirstHeader("Authorization");
        if (maybeAuthHeader.isEmpty() || !maybeAuthHeader.get().startsWith("Bearer ")) {
            logger.error("Authorization token missing or malformed.");
            response.setStatusCode(401); // Unauthorized
            response.getWriter().write("Authorization token missing or malformed.");
            throw new Exception("Unauthorized");
        }

        String idToken = maybeAuthHeader.get().substring("Bearer ".length());

        // Verify the token
        try {
            TokenVerifier tokenVerifier = TokenVerifier.newBuilder().setAudience(cloudRunURL).build();
            tokenVerifier.verify(idToken);
            logger.info("Authenticated idToken {}", idToken);
        } catch (Exception e) {
            logger.error("Token verification failed: {}", e.getMessage());
            response.setStatusCode(401); // Unauthorized
            response.getWriter().write("Unauthorized: Token verification failed.");
            throw new Exception("Failed to authenticate", e);
        }
    }
}
