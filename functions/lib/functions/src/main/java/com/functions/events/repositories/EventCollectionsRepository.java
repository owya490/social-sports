package com.functions.events.repositories;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.firebase.services.FirebaseService;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;

public class EventCollectionsRepository {
  private static final Logger logger = LoggerFactory.getLogger(EventCollectionsRepository.class);
  private static final Firestore db = FirebaseService.getFirestore();

  public static void addEventIdToEventCollection(String collectionId, boolean isPrivate,String eventId) {
    try {
      logger.info("Adding event {} to event collection {}", eventId, collectionId);
      db.collection("EventCollections")
          .document("Active")
          .collection(isPrivate ? "Private" : "Public")
          .document(collectionId)
          .update("eventIds", FieldValue.arrayUnion(eventId));    
    } catch (Exception e) {
      logger.error("Error adding event to event collection", e);
      throw e;
    }
  }

  public static List<String> getEventCollectionIdsContainingRecurringTemplate(boolean isPrivate, String recurrenceTemplateId) {
    try {
      logger.info("Getting event collection ids containing recurring template {}", recurrenceTemplateId);
      return db.collection("EventCollections")
          .document("Active")
          .collection(isPrivate ? "Private" : "Public")
          .whereArrayContains("recurringEventTemplateIds", recurrenceTemplateId)
          .get()
          .get()
          .getDocuments()
          .stream()
          .map(DocumentSnapshot::getId)     // <-- Get document ID
          .collect(Collectors.toList());
    } catch (Exception e) {
      logger.error("Error getting event collection ids containing recurring template", e);
      return Collections.emptyList();
    }
  }
}
