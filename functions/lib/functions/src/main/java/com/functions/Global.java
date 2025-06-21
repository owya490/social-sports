package com.functions;

import io.github.cdimascio.dotenv.Dotenv;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Exposes global statics and other useful global utilities.
 */
public class Global {
    private static Logger logger = LoggerFactory.getLogger(Global.class);

    private static Dotenv dotenv;

    static {
        try {
            dotenv = Dotenv.configure()
                    .ignoreIfMalformed()
                    .ignoreIfMissing()
                    .load();
        } catch (Exception e) {
            logger.error("Failed initializing Global class: " + e.getMessage());
        }
    }

    public static String getEnv(String key) {
        if (dotenv == null) {
            logger.error("Dotenv is not initialized");
            return null;
        }
        return dotenv.get(key);
    }
}
