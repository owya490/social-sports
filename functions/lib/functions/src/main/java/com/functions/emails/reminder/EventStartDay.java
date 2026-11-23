package com.functions.emails.reminder;

import java.time.LocalDate;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventData;
import com.functions.utils.TimeUtils;

/**
 * Selects events whose start falls on a Sydney calendar day and formats both
 * dates for the reminder template.
 */
public final class EventStartDay {
    private static final Logger logger = LoggerFactory.getLogger(EventStartDay.class);

    public Optional<EventReminderDraft> matching(EventData event, LocalDate date) {
        String eventId = event.getEventId();
        if (event.getStartDate() == null) {
            logger.warn("Event {} is missing startDate, skipping", eventId);
            return Optional.empty();
        }

        try {
            if (!TimeUtils.toSydneyLocalDate(event.getStartDate()).equals(date)) {
                return Optional.empty();
            }
            if (event.getEndDate() == null) {
                logger.warn("Event {} is missing endDate, skipping", eventId);
                return Optional.empty();
            }
            EventReminderDraft draft = EventReminderDraft.from(
                    event,
                    TimeUtils.formatTimestampForEmail(event.getStartDate()),
                    TimeUtils.formatTimestampForEmail(event.getEndDate()));
            logger.info("{} is starting on {}", eventId, date);
            return Optional.of(draft);
        } catch (RuntimeException e) {
            logger.error("Failed to read dates for event {}", eventId, e);
            return Optional.empty();
        }
    }
}
