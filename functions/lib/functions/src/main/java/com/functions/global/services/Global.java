package com.functions.global.services;

import io.github.cdimascio.dotenv.Dotenv;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Exposes global statics and other useful global utilities.
 */
public class Global {
    private static final Logger logger = LoggerFactory.getLogger(Global.class);

    private static final Dotenv dotenv = Dotenv.configure()
            .ignoreIfMalformed()
            .ignoreIfMissing()
            .load();

    /**
     * Retrieves the value of the specified environment variable.
     *
     * @param key the name of the environment variable to retrieve
     * @return the value of the environment variable, or {@code null} if not found or if the environment is not initialized
     */
    public static String getEnv(String key) {
        if (dotenv == null) {
            logger.error("Dotenv is not initialized");
            return null;
        }
        return dotenv.get(key);
    }
}
