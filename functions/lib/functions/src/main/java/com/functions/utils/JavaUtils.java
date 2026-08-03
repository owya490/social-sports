package com.functions.utils;

import java.io.IOException;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.google.cloud.Timestamp;

public class JavaUtils {
	private static final Logger logger = LoggerFactory.getLogger(JavaUtils.class);

	public static Map<String, Object> toMap(Object obj) {
		Map<String, Object> map = new HashMap<>();
		Class<?> currentClass = obj.getClass();
		
		try {
			// Traverse up the class hierarchy
			while (currentClass != null && currentClass != Object.class) {
				Field[] fields = currentClass.getDeclaredFields();
				for (Field field : fields) {
					field.setAccessible(true); // To access private fields
					map.put(field.getName(), field.get(obj)); // Add field name and value to the map
				}
				currentClass = currentClass.getSuperclass(); // Move up to the superclass
			}
		} catch (IllegalAccessException e) {
			e.printStackTrace();
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
        SimpleModule module = new SimpleModule();
        module.addSerializer(Timestamp.class, new TimestampSerializer());
        module.addDeserializer(Timestamp.class, new TimestampDeserializer());
        objectMapper.registerModule(module);
    }

    public static <T> T deepCopy(T object, Class<T> clazz) {
        try {
            String jsonString = objectMapper.writeValueAsString(object);
            return objectMapper.readValue(jsonString, clazz);
        } catch (Exception e) {
            throw new RuntimeException("Error during deep copy", e);
        }
    }
}
