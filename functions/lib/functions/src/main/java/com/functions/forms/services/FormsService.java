package com.functions.forms.services;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.repositories.EventsRepository;

public class FormsService {
    private static final Logger logger = LoggerFactory.getLogger(FormsService.class);

    /**
     * Retrieves the form ID associated with the specified event ID.
     *
     * Attempts to fetch event data for the given event ID and extract its form ID. 
     * Returns an {@code Optional} containing the form ID if present, or an empty {@code Optional} if the event or form ID is not found, or if an error occurs during retrieval.
     *
     * @param eventId the unique identifier of the event
     * @return an {@code Optional} containing the form ID if found, otherwise an empty {@code Optional}
     */
    public static Optional<String> getFormIdByEventId(String eventId) {
        try {
            return EventsRepository.getEventById(eventId).map(maybeEventData -> {
                String maybeFormId = maybeEventData.getFormId();
                if (maybeFormId != null) {
                    logger.info("Found form ID {} for event ID {}", maybeFormId, eventId);
                    return maybeFormId;
                } else {
                    logger.warn("No form ID found for event ID {}", eventId);
                    return null;
                }
            });
        } catch (Exception e) {
            logger.error("Error trying to get form ID for event ID {}: {}", eventId, e.getMessage());
            return Optional.empty();
        }
    }
}