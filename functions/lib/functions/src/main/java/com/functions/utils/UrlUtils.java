package com.functions.utils;

import com.functions.global.services.Global;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

public class UrlUtils {
    private static final Logger logger = LoggerFactory.getLogger(UrlUtils.class);

    /**
     * Constructs a full URL by prefixing the given path with the appropriate base URL for the current deployment environment.
     *
     * If the environment is "dev", the URL is prefixed with "http://localhost:3000".  
     * If the environment is "prod" or if the environment variable is missing or empty, the URL is prefixed with "https://sportshub.net.au".  
     * For any other environment, an empty {@code Optional} is returned.
     *
     * @param url the URL path to be appended to the environment-specific base URL
     * @return an {@code Optional} containing the full URL, or empty if the environment is not recognized
     * @throws RuntimeException if an error occurs while constructing the URL
     */
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
