package com.functions.fulfilment.pyng;

import java.util.function.Function;

import com.functions.global.handlers.Global;
import com.functions.utils.UrlUtils;
import com.functions.utils.environment.Environment;
import com.functions.utils.environment.EnvironmentUtils;

/**
 * Runtime settings for the Pay with Pyng Checkout Session API.
 * Values are read when a checkout is created or polled, so a deploy that has
 * not been given Pyng credentials keeps serving Stripe.
 */
final class PyngConfig {
    static final String ACCESS_TOKEN = "PYNG_ACCESS_TOKEN";
    static final String SITE_ID = "PYNG_SITE_ID";
    static final String API_BASE_URL = "PYNG_API_BASE_URL";
    static final String RETURN_BASE_URL = "PYNG_RETURN_BASE_URL";
    static final String RETURN_REDIRECT_SECRET = "PYNG_RETURN_REDIRECT_SECRET";

    static final String SANDBOX_API_BASE_URL = "https://sample.pyng.com.au";
    static final String PRODUCTION_API_BASE_URL = "https://app.pyng.com.au";

    static volatile Function<String, String> env = Global::getEnv;

    private PyngConfig() {
    }

    static String accessToken() {
        return require(ACCESS_TOKEN);
    }

    static String siteId() {
        return require(SITE_ID);
    }

    static String apiBaseUrl() {
        String override = optional(API_BASE_URL);
        if (override != null) {
            return stripTrailingSlash(override);
        }
        try {
            if (EnvironmentUtils.getEnvironment() == Environment.PRODUCTION) {
                return PRODUCTION_API_BASE_URL;
            }
        } catch (RuntimeException ignored) {
            // An unresolved project name must not send checkout traffic to production.
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

    /**
     * Empty until Pyng provisions a return-redirect signing secret. Distinct
     * from any webhook secret.
     */
    static String returnRedirectSecret() {
        return optional(RETURN_REDIRECT_SECRET);
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
