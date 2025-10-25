package com.functions.global.handlers;

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

    public static String getEnv(String key) {
        if (dotenv == null) {
            logger.error("Dotenv is not initialized");
            return null;
        }
        return dotenv.get(key);
    }
}
