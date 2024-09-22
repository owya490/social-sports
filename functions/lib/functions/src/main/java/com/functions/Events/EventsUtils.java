package com.functions.Events;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class EventsUtils {
	public static List<String> tokenizeText(String text) {
		return Arrays.stream(text.toLowerCase().split("\\s+"))
				.filter(token -> !token.isEmpty()).collect(Collectors.toList());
	}
}
