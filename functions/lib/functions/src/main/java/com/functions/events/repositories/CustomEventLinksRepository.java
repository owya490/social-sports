package com.functions.events.repositories;

import java.util.ArrayList;
import java.util.List;

import com.functions.events.models.CustomEventLink;
import com.functions.firebase.services.FirebaseService;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.Transaction;

public class CustomEventLinksRepository {
  private static final Firestore db = FirebaseService.getFirestore();

  public static List<DocumentSnapshot> getEventLinkDocumentsPointedToRecurrence(
      String userId, String recurrenceTemplateId, Transaction transaction) throws Exception {
    Query query = db
        .collection("CustomLinks")
        .document("Events")
        .collection(userId)
        .whereEqualTo("type", CustomEventLink.Type.RECURRING_EVENT.getType())
        .whereEqualTo("referenceId", recurrenceTemplateId);
    return new ArrayList<>(transaction.get(query).get().getDocuments());
  }

  public static void saveCustomEventLink(DocumentReference documentReference,
      CustomEventLink customEventLink, Transaction transaction) {
    transaction.set(documentReference, customEventLink);
  }
}
