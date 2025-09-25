package com.functions.utils.environment;

import com.functions.global.handlers.Global;

public class EnvironmentUtils {
  
    private static final String PROJECT_NAME_ENV_VAR = "PROJECT_NAME";

    public static Environment getEnvironment() {
        return Environment.fromString(Global.getEnv(PROJECT_NAME_ENV_VAR));
    }
}
