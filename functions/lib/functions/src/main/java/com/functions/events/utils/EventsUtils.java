package com.functions.events.utils;

import com.functions.users.models.PrivateUserData;
import com.functions.users.services.Users;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class EventsUtils {
	public static List<String> tokenizeText(String text) {
		return Arrays.stream(text.toLowerCase().split("\\s+"))
				.filter(token -> !token.isEmpty()).collect(Collectors.toList());
	}

	public static void addEventIdToUserOrganiserEvents(String userId, String eventId) throws Exception {
		PrivateUserData privateUserData = Users.getPrivateUserDataById(userId);

		List<String> organiserEvents = privateUserData.getOrganiserEvents();
		organiserEvents.add(eventId);
		privateUserData.setOrganiserEvents(organiserEvents);

		Users.updatePrivateUserData(userId, privateUserData);
	}
}
