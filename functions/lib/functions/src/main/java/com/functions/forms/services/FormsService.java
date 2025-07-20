package com.functions.forms.services;

import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.functions.events.repositories.EventsRepository;

public class FormsService {
    private static final Logger logger = LoggerFactory.getLogger(FormsService.class);

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
            logger.error("[FormsService] Error trying to get form ID for event ID {}: {}", eventId, e.getMessage());
            throw new RuntimeException("[FormsService] Failed to retrieve form ID for event ID: " + eventId, e);
        }
    }
}