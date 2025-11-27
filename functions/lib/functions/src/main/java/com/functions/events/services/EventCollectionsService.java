package com.functions.events.services;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.repositories.EventCollectionsRepository;

public class EventCollectionsService {
  private static final Logger logger = LoggerFactory.getLogger(EventCollectionsService.class);

  public static void addEventToEventCollectionsWithRecurrenceTemplate(String recurrenceTemplateId, String eventId) {
    logger.info("Adding event {} to event collections with recurrence template {}", eventId, recurrenceTemplateId);
    List<String> publicEventCollectionIds = EventCollectionsRepository.getEventCollectionIdsContainingRecurringTemplate(false, recurrenceTemplateId);
    List<String> privateEventCollectionIds = EventCollectionsRepository.getEventCollectionIdsContainingRecurringTemplate(true, recurrenceTemplateId);
    logger.info("Found Public event collection ids {} containing recurrence template {}", publicEventCollectionIds, recurrenceTemplateId);
    publicEventCollectionIds.forEach(eventCollectionId -> {
      try {
        EventCollectionsRepository.addEventIdToEventCollection(eventCollectionId, false, eventId);
      } catch (Exception e) {
        logger.error("Error adding event {} to public event collection {}", eventId, eventCollectionId, e);
        // Continue with other event collections
      }
    });
    
    logger.info("Found Private event collection ids {} containing recurrence template {}", privateEventCollectionIds, recurrenceTemplateId);
    privateEventCollectionIds.forEach(eventCollectionId -> {
      try {
        EventCollectionsRepository.addEventIdToEventCollection(eventCollectionId, true, eventId);
      } catch (Exception e) {
        logger.error("Error adding event {} to private event collection {}", eventId, eventCollectionId, e);
        // Continue with other event collections
      }
    });
  }  
}
