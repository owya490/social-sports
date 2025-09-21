package com.functions.utils;

import com.functions.global.handlers.Global;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

public class UrlUtils {
    private static final Logger logger = LoggerFactory.getLogger(UrlUtils.class);

    // NOTE: this url MUST contain the substring of the one in webhooks.py, otherwise, we risk fulfilment sessions
    // not being correctly processed by stripe webhook.
    public static final String SPORTSHUB_URL = "https://www.sportshub.net.au";

    public static Optional<String> getUrlWithCurrentEnvironment(String url) {
        try {
            String environment = Global.getEnv("DEPLOYMENT_ENV");

            if (environment == null || environment.isEmpty()) {
                logger.warn(
                        "Environment variable 'DEPLOYMENT_ENV' is not set or empty. Defaulting to 'prod'.");
                environment = "prod";
            }

            if (environment.equals("dev")) {
                return Optional.of(String.format("http://localhost:3000%s", url));
            } else if (environment.equals("prod")) {
                return Optional.of(String.format("%s%s", SPORTSHUB_URL, url));
            }

            return Optional.empty();
        } catch (Exception e) {
            logger.error("Error constructing URL with current environment: {}", e.getMessage());
            throw new RuntimeException(e);
        }

    }
}
