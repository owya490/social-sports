package com.functions.events.utils;

import com.functions.users.models.PrivateUserData;
import com.functions.users.models.PublicUserData;
import com.functions.users.services.Users;
import com.google.cloud.firestore.Transaction;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class EventsUtils {
    public static List<String> tokenizeText(String text) {
        return Arrays.stream(text.toLowerCase().split("\\s+")).filter(token -> !token.isEmpty())
                .collect(Collectors.toList());
    }

    public static void addEventIdToUserOrganiserPublicUpcomingEvents(String userId, String eventId, Transaction transaction)
            throws Exception {
        PublicUserData publicUserData = Users.getPublicUserDataById(userId, transaction);

        List<String> publicUpcomingOrganiserEvents =
                publicUserData.getPublicUpcomingOrganiserEvents();
        publicUpcomingOrganiserEvents.add(eventId);
        publicUserData.setPublicUpcomingOrganiserEvents(publicUpcomingOrganiserEvents);

        Users.updatePublicUserData(userId, publicUserData, transaction);
    }

    public static void addEventIdToUserOrganiserEvents(String userId, String eventId, Transaction transaction)
            throws Exception {
        PrivateUserData privateUserData = Users.getPrivateUserDataById(userId, transaction);

        List<String> organiserEvents = privateUserData.getOrganiserEvents();
        organiserEvents.add(eventId);
        privateUserData.setOrganiserEvents(organiserEvents);

        Users.updatePrivateUserData(userId, privateUserData, transaction);
    }
}
