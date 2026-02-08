package com.functions.events.services;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventData;
import com.functions.events.repositories.EventsRepository;
import com.google.cloud.Timestamp;

/**
 * Service for event-related business logic.
 */
public class EventsService {
    private static final Logger logger = LoggerFactory.getLogger(EventsService.class);

    /**
     * Get active public events for a specific organiser.
     * Only returns future events, sorted by start date.
     *
     * @param organiserId the organiser's user ID
     * @return list of future events sorted by start date
     */
    public static List<EventData> getActivePublicEventsByOrganiser(String organiserId) {
        logger.info("Getting active public events for organiser: {}", organiserId);
        
        try {
            List<EventData> events = EventsRepository.getActivePublicEventsByOrganiser(organiserId);
            
            Timestamp now = Timestamp.now();
            List<EventData> futureEvents = events.stream()
                    .filter(event -> event.getStartDate() != null && event.getStartDate().compareTo(now) >= 0)
                    .sorted(Comparator.comparing(EventData::getStartDate))
                    .collect(Collectors.toList());
            
            logger.info("Found {} future events for organiser {}", futureEvents.size(), organiserId);
            return futureEvents;
        } catch (Exception e) {
            logger.error("Error getting active public events for organiser: {}", organiserId, e);
            throw new RuntimeException("Failed to get events for organiser: " + organiserId, e);
        }
    }
}
