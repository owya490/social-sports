package com.functions;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;

public class JavaUtils {
	public static Map<String, Object> toMap(Object obj) {
		Map<String, Object> map = new HashMap<>();
		try {
			Field[] fields = obj.getClass().getDeclaredFields();
			for (Field field : fields) {
				field.setAccessible(true); // To access private fields
				map.put(field.getName(), field.get(obj)); // Add field name and value to the map
			}
		} catch (IllegalAccessException e) {
			e.printStackTrace();
		}
		return map;
	}
}
