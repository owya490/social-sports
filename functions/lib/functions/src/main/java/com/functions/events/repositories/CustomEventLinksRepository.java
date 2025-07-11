package com.functions.events.repositories;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.FirebaseService;
import com.functions.events.models.CustomEventLink;
import com.google.cloud.firestore.Firestore;

public class CustomEventLinksRepository {
  private static final Logger logger = LoggerFactory.getLogger(CustomEventLinksRepository.class);
  private static final Firestore db = FirebaseService.getFirestore();


  public static void saveCustomEventLink(String userId, CustomEventLink customEventLink) {
    try {
    logger.info("Saving custom event link for user {}", userId);
    db.collection("CustomLinks")
      .document("Events")
      .collection(userId)
      .document(customEventLink.getCustomEventLink())
      .set(customEventLink);
    } catch (Exception e) {
      logger.error("Error saving custom event link", e);
      throw e;
    }
  }

  public static List<CustomEventLink> getAllEventLinksPointedToRecurrence(String userId, String recurrenceTemplateId) {
    try {
      logger.info("Getting all event links pointed to recurrence for user {}", userId);
      return db
        .collection("CustomLinks")
        .document("Events")
        .collection(userId)
        .whereEqualTo("type", CustomEventLink.Type.RECURRING_EVENT.getType())
        .whereEqualTo("referenceId", recurrenceTemplateId).get().get()
        .toObjects(CustomEventLink.class);
    } catch (Exception e) {
      logger.error("Error getting all event links pointed to recurrence", e);
      return Collections.emptyList();
    }
  }
}
