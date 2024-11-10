package com.functions.events.utils;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import com.functions.FirebaseService;
import com.functions.utils.JavaUtils;
import com.functions.FirebaseService.CollectionPaths;
import com.functions.users.models.PrivateUserData;
import com.functions.users.services.Users;
import com.google.cloud.firestore.Firestore;

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

		Firestore db = FirebaseService.getFirestore();
		// TODO: use the usersService to update organiser events
		db.collection(CollectionPaths.USERS).document(CollectionPaths.ACTIVE).collection(CollectionPaths.PRIVATE)
				.document(userId).update(JavaUtils.toMap(privateUserData));
	}
}
