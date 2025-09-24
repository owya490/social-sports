package com.functions.utils;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.google.cloud.Timestamp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;

public class JavaUtils {
	private static final Logger logger = LoggerFactory.getLogger(JavaUtils.class);

	public static Map<String, Object> toMap(Object obj) {
		logger.debug("Converting object to Map: {}", obj.getClass().getSimpleName());

		if (obj == null) {
			logger.warn("Attempting to convert null object to Map");
			return new HashMap<>();
		}

		Map<String, Object> map = new HashMap<>();
		Class<?> currentClass = obj.getClass();
		int fieldCount = 0;

		try {
			// Traverse up the class hierarchy
			while (currentClass != null && currentClass != Object.class) {
				Field[] fields = currentClass.getDeclaredFields();
				logger.debug("Processing {} fields from class: {}", fields.length, currentClass.getSimpleName());

				for (Field field : fields) {
					field.setAccessible(true); // To access private fields
					Object value = field.get(obj);
					map.put(field.getName(), value);
					fieldCount++;

					logger.trace("Added field to map: {} = {}", field.getName(),
							value != null ? value.getClass().getSimpleName() : "null");
				}
				currentClass = currentClass.getSuperclass(); // Move up to the superclass
			}

			logger.debug("Successfully converted object to Map: {} fields processed", fieldCount);
		} catch (IllegalAccessException e) {
			logger.error("Error accessing fields during object to Map conversion: {}", e.getMessage(), e);
			throw new RuntimeException("Failed to convert object to Map", e);
		}
		return map;
	}

	public static class TimestampSerializer extends JsonSerializer<Timestamp> {
		@Override
		public void serialize(Timestamp value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
			gen.writeString(value.toString());
		}
	}

	public static class TimestampDeserializer extends JsonDeserializer<Timestamp> {
		@Override
		public Timestamp deserialize(JsonParser p, DeserializationContext ctxt) throws IOException, JsonProcessingException {
			return Timestamp.parseTimestamp(p.getText());
		}
	}

	public static final ObjectMapper objectMapper = new ObjectMapper();

    static {
    	logger.info("Initializing ObjectMapper with custom Timestamp serializers");
        SimpleModule module = new SimpleModule();
        module.addSerializer(Timestamp.class, new TimestampSerializer());
        module.addDeserializer(Timestamp.class, new TimestampDeserializer());
        objectMapper.registerModule(module);
        logger.debug("ObjectMapper initialization completed");
    }

    public static <T> T deepCopy(T object, Class<T> clazz) {
    	logger.debug("Performing deep copy: {} -> {}",
    			object != null ? object.getClass().getSimpleName() : "null",
    			clazz.getSimpleName());

        try {
            String jsonString = objectMapper.writeValueAsString(object);
            logger.trace("Serialized object to JSON (length: {})", jsonString.length());

            T result = objectMapper.readValue(jsonString, clazz);
            logger.debug("Deep copy completed successfully");
            return result;
        } catch (Exception e) {
            logger.error("Error during deep copy from {} to {}: {}",
            		object != null ? object.getClass().getSimpleName() : "null",
            		clazz.getSimpleName(), e.getMessage(), e);
            throw new RuntimeException("Error during deep copy", e);
        }
    }
}
