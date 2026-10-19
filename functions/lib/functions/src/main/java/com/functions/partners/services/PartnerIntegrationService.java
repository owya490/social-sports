package com.functions.partners.services;

import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

import com.functions.global.exceptions.AuthenticationException;
import com.functions.global.exceptions.AuthorizationException;
import com.functions.partners.models.PartnerContext;
import com.functions.partners.models.PartnerIntegration;
import com.functions.partners.repositories.PartnerIntegrationRepository;
import com.functions.utils.environment.Environment;
import com.functions.utils.environment.EnvironmentUtils;
import com.google.cloud.functions.HttpRequest;

public final class PartnerIntegrationService {
    public static final String KEY_HEADER = "X-Sportshub-Partner-Key";
    private static final Pattern INTEGRATION_ID = Pattern.compile("[a-z0-9][a-z0-9-]{0,63}");
    private static final Pattern KEY = Pattern.compile("([a-z0-9][a-z0-9-]{0,63})\\.([A-Za-z0-9_-]{43})");
    private static final SecureRandom RANDOM = new SecureRandom();

    private PartnerIntegrationService() {
    }

    public static PartnerContext verify(HttpRequest request) {
        String key = singleHeader(request, KEY_HEADER, true);
        var matcher = KEY.matcher(key);
        if (key.length() > 108 || !matcher.matches() || !isCanonicalSecret(matcher.group(2))) {
            throw invalidKey();
        }
        String integrationId = matcher.group(1);
        String origin = singleHeader(request, "Origin", false);
        Environment environment = environment();
        Origin requestedOrigin;
        try {
            requestedOrigin = parseOrigin(origin, environment);
        } catch (IllegalArgumentException e) {
            throw deniedOrigin();
        }

        PartnerIntegration integration = PartnerIntegrationRepository.findById(integrationId)
                .orElseThrow(PartnerIntegrationService::invalidKey);
        List<Origin> allowedOrigins;
        try {
            allowedOrigins = integration.allowedOrigins().stream()
                    .map(value -> parseOrigin(value, environment)).toList();
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("Invalid partner integration configuration");
        }
        if (!integration.enabled() || !matchesDigest(key, integration.keyDigests())) {
            throw invalidKey();
        }
        if (!allowedOrigins.contains(requestedOrigin)) {
            throw deniedOrigin();
        }
        return new PartnerContext(integrationId, integration.organiserId(), origin);
    }

    public static String generateKey(String integrationId) {
        if (integrationId == null || !INTEGRATION_ID.matcher(integrationId).matches()) {
            throw new IllegalArgumentException("Invalid integration ID");
        }
        byte[] secret = new byte[32];
        RANDOM.nextBytes(secret);
        return integrationId + "." + Base64.getUrlEncoder().withoutPadding().encodeToString(secret);
    }

    public static String digestKey(String key) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(key.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Partner key digest unavailable", e);
        }
    }

    public static void validateOrigin(String origin, Environment environment) {
        if (environment == null) {
            throw new IllegalArgumentException("Partner environment is required");
        }
        parseOrigin(origin, environment);
    }

    private static boolean matchesDigest(String key, List<String> digests) {
        byte[] candidate = digestKey(key).getBytes(StandardCharsets.US_ASCII);
        boolean matches = false;
        for (String digest : digests) {
            matches |= MessageDigest.isEqual(candidate, digest.getBytes(StandardCharsets.US_ASCII));
        }
        return matches;
    }

    private static boolean isCanonicalSecret(String value) {
        byte[] decoded = Base64.getUrlDecoder().decode(value);
        return decoded.length == 32
                && Base64.getUrlEncoder().withoutPadding().encodeToString(decoded).equals(value);
    }

    private static String singleHeader(HttpRequest request, String name, boolean keyHeader) {
        Map<String, List<String>> headers = request.getHeaders();
        List<Map.Entry<String, List<String>>> matches = headers == null ? List.of() : headers.entrySet().stream()
                .filter(entry -> name.equalsIgnoreCase(entry.getKey()))
                .toList();
        List<String> values = matches.size() == 1 ? matches.get(0).getValue() : null;
        if (values == null || values.size() != 1 || values.get(0) == null || values.get(0).isBlank()
                || values.get(0).length() > (keyHeader ? 108 : 2048)) {
            if (keyHeader) {
                throw invalidKey();
            }
            throw deniedOrigin();
        }
        return values.get(0);
    }

    private static Environment environment() {
        try {
            Environment environment = EnvironmentUtils.getEnvironment();
            if (environment != Environment.PRODUCTION && environment != Environment.DEVELOPMENT) {
                throw new IllegalStateException("Partner environment is required");
            }
            return environment;
        } catch (RuntimeException e) {
            throw new IllegalStateException("Partner environment is required");
        }
    }

    private static Origin parseOrigin(String value, Environment environment) {
        try {
            URI uri = new URI(value);
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
            int port = uri.getPort();
            if (value.length() > 2048 || host.isEmpty() || uri.isOpaque() || uri.getRawUserInfo() != null
                    || uri.getRawQuery() != null || uri.getRawFragment() != null
                    || (uri.getRawPath() != null && !uri.getRawPath().isEmpty())
                    || uri.getRawAuthority().endsWith(":") || port == 0 || port > 65535) {
                throw new IllegalArgumentException("Invalid origin");
            }
            if ("https".equals(scheme)) {
                return new Origin(scheme, host, port == -1 ? 443 : port);
            }
            if ("http".equals(scheme) && environment == Environment.DEVELOPMENT && port > 0
                    && (host.equals("localhost") || host.equals("127.0.0.1") || host.equals("[::1]"))) {
                return new Origin(scheme, host, port);
            }
            throw new IllegalArgumentException("Invalid origin");
        } catch (URISyntaxException e) {
            throw new IllegalArgumentException("Invalid origin");
        }
    }

    private static AuthenticationException invalidKey() {
        return new AuthenticationException("Invalid partner key");
    }

    private static AuthorizationException deniedOrigin() {
        return new AuthorizationException("Partner origin is not allowed");
    }

    private record Origin(String scheme, String host, int port) {
    }
}
