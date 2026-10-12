package com.functions.fulfilment.pyng;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.JsonNode;
import com.functions.fulfilment.pyng.PyngCheckoutClient.Exchange;
import com.functions.fulfilment.pyng.PyngCheckoutClient.RawResponse;
import com.functions.fulfilment.pyng.PyngCheckoutClient.Transport;
import com.functions.utils.JavaUtils;

/**
 * OAuth 2.0 client-credentials token for the Checkout API.
 * POST /checkout/oauth2/token with Basic base64(username:password).
 */
final class PyngAccessToken {
    private static final Logger logger = LoggerFactory.getLogger(PyngAccessToken.class);
    private static final long EXPIRY_SKEW_SECONDS = 60;

    private static volatile String cachedToken;
    private static volatile long expiresAtMs;

    private PyngAccessToken() {
    }

    static String bearer() throws IOException {
        return bearer(PyngCheckoutClient::send);
    }

    static String bearer(Transport transport) throws IOException {
        long now = System.currentTimeMillis();
        String current = cachedToken;
        if (current != null && now < expiresAtMs) {
            return current;
        }
        synchronized (PyngAccessToken.class) {
            now = System.currentTimeMillis();
            if (cachedToken != null && now < expiresAtMs) {
                return cachedToken;
            }
            Issued issued = request(transport);
            cachedToken = issued.accessToken();
            long ttlSeconds = Math.max(1, issued.expiresInSeconds() - EXPIRY_SKEW_SECONDS);
            expiresAtMs = now + ttlSeconds * 1000L;
            logger.info("Fetched Pyng access token expiring in {} seconds", issued.expiresInSeconds());
            return cachedToken;
        }
    }

    static void clear() {
        synchronized (PyngAccessToken.class) {
            cachedToken = null;
            expiresAtMs = 0;
        }
    }

    private static Issued request(Transport transport) throws IOException {
        String credentials = PyngConfig.username() + ":" + PyngConfig.password();
        String basic = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
        String body = "grant_type=client_credentials&scope="
                + URLEncoder.encode(PyngConfig.scope(), StandardCharsets.UTF_8);

        Map<String, String> headers = new LinkedHashMap<>();
        headers.put("Content-Type", "application/x-www-form-urlencoded");
        headers.put("Accept", "application/json");
        headers.put("Authorization", "Basic " + basic);

        RawResponse response = transport.exchange(new Exchange(
                "POST",
                URI.create(PyngConfig.apiBaseUrl() + "/checkout/oauth2/token"),
                headers,
                body));
        if (response.statusCode() != 200) {
            throw new IllegalStateException("Pyng access token request failed with status " + response.statusCode());
        }
        if (response.body() == null || response.body().isBlank()) {
            throw new IllegalStateException("Pyng access token response was empty");
        }

        JsonNode root = JavaUtils.objectMapper.readTree(response.body());
        String accessToken = text(root, "access_token");
        String tokenType = text(root, "token_type");
        JsonNode expiresIn = root.get("expires_in");
        if (accessToken == null || expiresIn == null || !expiresIn.isNumber() || expiresIn.asLong() < 1) {
            throw new IllegalStateException("Pyng access token response is missing access_token or expires_in");
        }
        if (tokenType != null && !"Bearer".equalsIgnoreCase(tokenType)) {
            throw new IllegalStateException("Pyng access token type was " + tokenType);
        }
        return new Issued(accessToken, expiresIn.asLong());
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        String text = value.asText();
        if (text == null || text.isBlank()) {
            return null;
        }
        return text;
    }

    private record Issued(String accessToken, long expiresInSeconds) {
    }
}
