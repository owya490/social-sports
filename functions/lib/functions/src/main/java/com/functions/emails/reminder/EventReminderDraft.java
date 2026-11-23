package com.functions.emails.reminder;

import java.util.Map;

import com.functions.events.models.EventData;

/**
 * The event fields a reminder email needs, already formatted for the Loops template.
 */
public record EventReminderDraft(
        String eventId,
        String eventName,
        String startDate,
        String endDate,
        String location) {

    public static EventReminderDraft from(EventData event, String startDate, String endDate) {
        return new EventReminderDraft(
                event.getEventId(),
                text(event.getName()),
                startDate,
                endDate,
                text(event.getLocation()));
    }

    public Map<String, String> variablesFor(ReminderPurchaser purchaser) {
        return Map.of(
                "name", purchaser.displayName(),
                "eventName", eventName,
                "eventId", eventId,
                "startDate", startDate,
                "endDate", endDate,
                "location", location);
    }

    private static String text(String value) {
        return value == null ? "" : value;
    }
}
