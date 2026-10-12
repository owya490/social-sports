package com.functions.fulfilment.pyng;

import java.util.function.Function;

import com.functions.global.handlers.Global;
import com.functions.utils.UrlUtils;
import com.functions.utils.environment.Environment;
import com.functions.utils.environment.EnvironmentUtils;

/**
 * Runtime settings for the Pay with Pyng Checkout Session API.
 * Username, password, and signing secret are per environment. Site ids are
 * not configured here; each organiser stores one on their private user record.
 */
final class PyngConfig {
    static final String API_BASE_URL = "PYNG_API_BASE_URL";
    static final String RETURN_BASE_URL = "PYNG_RETURN_BASE_URL";

    static final String DEV_USERNAME = "PYNG_DEV_USERNAME";
    static final String DEV_PASSWORD = "PYNG_DEV_PASSWORD";
    static final String DEV_SIGNING_SECRET = "PYNG_DEV_SIGNING_SECRET";

    static final String PROD_USERNAME = "PYNG_PROD_USERNAME";
    static final String PROD_PASSWORD = "PYNG_PROD_PASSWORD";
    static final String PROD_SIGNING_SECRET = "PYNG_PROD_SIGNING_SECRET";

    static final String SESSION_WRITE_SCOPE = "urn:pyng:checkout:session:write";
    static final String SESSION_READ_SCOPE = "urn:pyng:checkout:session:read";

    static final String SANDBOX_API_BASE_URL = "https://sample.pyng.com.au";
    static final String PRODUCTION_API_BASE_URL = "https://app.pyng.com.au";

    static volatile Function<String, String> env = Global::getEnv;
    static volatile Boolean productionOverride;

    private PyngConfig() {
    }

    static String username() {
        return require(production() ? PROD_USERNAME : DEV_USERNAME);
    }

    static String password() {
        return require(production() ? PROD_PASSWORD : DEV_PASSWORD);
    }

    static String signingSecret() {
        return optional(production() ? PROD_SIGNING_SECRET : DEV_SIGNING_SECRET);
    }

    static String apiBaseUrl() {
        String override = optional(API_BASE_URL);
        if (override != null) {
            return stripTrailingSlash(override);
        }
        if (production()) {
            return PRODUCTION_API_BASE_URL;
        }
        return SANDBOX_API_BASE_URL;
    }

    static String returnBaseUrl() {
        String override = optional(RETURN_BASE_URL);
        if (override != null) {
            return stripTrailingSlash(override);
        }
        return stripTrailingSlash(UrlUtils.getUrlWithCurrentEnvironment("")
                .orElse(UrlUtils.SPORTSHUB_URL));
    }

    static boolean production() {
        if (productionOverride != null) {
            return productionOverride;
        }
        try {
            return EnvironmentUtils.getEnvironment() == Environment.PRODUCTION;
        } catch (RuntimeException e) {
            return false;
        }
    }

    private static String require(String key) {
        String value = optional(key);
        if (value == null) {
            throw new IllegalStateException(key + " is not set");
        }
        return value;
    }

    private static String optional(String key) {
        String value = env.apply(key);
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static String stripTrailingSlash(String value) {
        String stripped = value;
        while (stripped.endsWith("/")) {
            stripped = stripped.substring(0, stripped.length() - 1);
        }
        return stripped;
    }
}
