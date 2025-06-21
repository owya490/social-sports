package com.functions.utils;

import com.functions.Global;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

public class UrlUtils {
    private static final Logger logger = LoggerFactory.getLogger(UrlUtils.class);

    public static Optional<String> getUrlWithCurrentEnvironment(String url) {
        try {
            String environment = Global.getEnv("DEPLOYMENT_ENV");

            if (environment == null || environment.isEmpty()) {
                logger.warn("Environment variable 'DEPLOYMENT_ENV' is not set or empty. Defaulting to 'dev'.");
                environment = "prod"; // Default to prod if not set
            }

            if (environment.equals("dev")) {
                return Optional.of(String.format("http://localhost:3000%s", url));
            } else if (environment.equals("prod")) {
                return Optional.of(String.format("https://sportshub.net.au%s", url));
            }

            return Optional.empty();
        } catch (Exception e) {
            logger.error("Error constructing URL with current environment: {}", e.getMessage());
            throw new RuntimeException(e);
        }

    }
}
