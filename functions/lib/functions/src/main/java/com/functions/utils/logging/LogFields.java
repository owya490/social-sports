package com.functions.utils.logging;

import java.util.LinkedHashMap;
import java.util.Map;

public final class LogFields {
    private LogFields() {
    }

    public static Map<String, Object> of(Object... keyValues) {
        Map<String, Object> fields = new LinkedHashMap<>();
        if (keyValues == null) {
            return fields;
        }

        for (int i = 0; i + 1 < keyValues.length; i += 2) {
            Object key = keyValues[i];
            Object value = keyValues[i + 1];
            if (key != null && value != null) {
                String keyString = String.valueOf(key);
                if (!keyString.isBlank()) {
                    fields.put(keyString, value);
                }
            }
        }

        return fields;
    }
}
