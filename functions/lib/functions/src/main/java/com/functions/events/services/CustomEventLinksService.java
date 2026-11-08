package com.functions.events.services;

import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.CustomEventLink;
import com.functions.events.repositories.CustomEventLinksRepository;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Transaction;

public class CustomEventLinksService {
  private static final Logger logger = LoggerFactory.getLogger(CustomEventLinksService.class);

  public static List<DocumentSnapshot> getEventLinkDocumentsPointedToRecurrence(String userId,
      String recurrenceTemplateId, Transaction transaction) throws Exception {
    return CustomEventLinksRepository.getEventLinkDocumentsPointedToRecurrence(
        userId, recurrenceTemplateId, transaction);
  }

  public static List<String> updateEventLinks(List<DocumentSnapshot> eventLinkDocuments,
      String eventId, Transaction transaction) {
    List<String> updatedEventLinks = eventLinkDocuments.stream().map(eventLinkDocument -> {
      CustomEventLink eventLink = eventLinkDocument.toObject(CustomEventLink.class);
      CustomEventLink updatedEventLink = new CustomEventLink(
          eventLink.getCustomEventLink(),
          eventLink.getCustomEventLinkName(),
          eventLink.getId(),
          eventId,
          eventLink.getReferenceId(),
          eventLink.getReferenceName(),
          eventLink.getType());
      CustomEventLinksRepository.saveCustomEventLink(
          eventLinkDocument.getReference(), updatedEventLink, transaction);
      return updatedEventLink.getCustomEventLink();
    }).collect(Collectors.toList());
    logger.info("Updated {} event links: {}", updatedEventLinks.size(), updatedEventLinks);
    return updatedEventLinks;
  }
}
