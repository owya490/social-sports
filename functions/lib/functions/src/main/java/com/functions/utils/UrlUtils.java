package com.functions.utils;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.utils.environment.Environment;
import com.functions.utils.environment.EnvironmentUtils;
public class UrlUtils {
    private static final Logger logger = LoggerFactory.getLogger(UrlUtils.class);

    // NOTE: this url MUST contain the substring of the one in webhooks.py, otherwise, we risk fulfilment sessions
    // not being correctly processed by stripe webhook.
    public static final String SPORTSHUB_URL = "https://www.sportshub.net.au";

    public static Optional<String> getUrlWithCurrentEnvironment(String url) {
        try {
            Environment environment = EnvironmentUtils.getEnvironment();

            if (environment == null) {
                logger.warn(
                        "Cannot determine environment. Defaulting to 'prod'.");
                environment = Environment.PRODUCTION;
            }

            if (environment.equals(Environment.DEVELOPMENT)) {
                return Optional.of(String.format("http://localhost:3000%s", url));
            } else if (environment.equals(Environment.PRODUCTION)) {
                return Optional.of(String.format("%s%s", SPORTSHUB_URL, url));
            }

            return Optional.empty();
        } catch (Exception e) {
            logger.error("Error constructing URL with current environment: {}", e.getMessage());
            throw new RuntimeException(e);
        }

    }
}
