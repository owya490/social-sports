package com.functions.events.services;

import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.CustomEventLink;
import com.functions.events.repositories.CustomEventLinksRepository;

public class CustomEventLinksService {
  private static final Logger logger = LoggerFactory.getLogger(CustomEventLinksService.class);

  public static List<String> updateEventLinksPointedToRecurrence(String userId, String recurrenceTemplateId, String eventId) {
    logger.info("Updating event links pointed to recurrence template {}", recurrenceTemplateId);
    List<CustomEventLink> allReferencedEventLinks = CustomEventLinksRepository.getAllEventLinksPointedToRecurrence(userId, recurrenceTemplateId);
    logger.info("All referenced event links: {}", allReferencedEventLinks);
    allReferencedEventLinks.forEach(eventLink -> {
      CustomEventLink updatedEventLink = new CustomEventLink(
        eventLink.getCustomEventLink(),
        eventLink.getCustomEventLinkName(),
        eventLink.getId(),
        eventId,
        eventLink.getReferenceId(),
        eventLink.getReferenceName(),
        eventLink.getType()
      );
      CustomEventLinksRepository.saveCustomEventLink(userId, updatedEventLink);
    });
    List<String> updatedEventLinks = allReferencedEventLinks.stream().map(CustomEventLink::getCustomEventLink).collect(Collectors.toList());
    logger.info("Updated {} event links: {}", updatedEventLinks.size(), updatedEventLinks);
    return updatedEventLinks;
  }
}
