package com.functions.events.models;

import lombok.*;

@Value
@Builder(toBuilder = true)
@NoArgsConstructor(force = true, access = AccessLevel.PRIVATE)
@AllArgsConstructor
public class RecurrenceTemplate {
    NewEventData eventData;
    RecurrenceData recurrenceData;
    /**
     * Derived from the RecurringEvents/Archived folder when a template is loaded.
     * Not written back: older function revisions reject documents that contain this field.
     */
    Boolean archived;

    public RecurrenceTemplate archivedCopy() {
        if (eventData == null || recurrenceData == null) {
            throw new IllegalStateException("Recurrence template is incomplete");
        }
        eventData.setIsActive(false);
        return toBuilder()
                .eventData(eventData)
                .recurrenceData(recurrenceData.toBuilder().recurrenceEnabled(false).build())
                .archived(true)
                .build();
    }
}
