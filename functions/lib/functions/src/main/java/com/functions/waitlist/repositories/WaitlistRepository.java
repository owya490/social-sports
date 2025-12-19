package com.functions.waitlist.repositories;

import com.functions.firebase.services.FirebaseService;
import com.functions.waitlist.models.WaitlistEntry;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Waitlist Firestore operations.
 * 
 * Firestore path: Waitlist/{eventId}
 */
public class WaitlistRepository {
  private static final Logger logger = LoggerFactory.getLogger(WaitlistRepository.class);
  private static final String WAITLIST_COLLECTION = "Waitlist";
  private static final String WAITLIST_POOL_COLLECTION = "WaitlistPool";

  /**
   * Get the waitlist document for an event
   */
  public static List<WaitlistEntry> getWaitlistByEventId(String eventId) {
    try {
      Firestore db = FirebaseService.getFirestore();
      CollectionReference collectionRef = db.collection(WAITLIST_COLLECTION).document(eventId).collection(WAITLIST_POOL_COLLECTION);
      List<WaitlistEntry> waitlistEntries = collectionRef.get().get().toObjects(WaitlistEntry.class);

      return waitlistEntries;
    } catch (Exception e) {
      logger.error("Error retrieving waitlist for event: {}", eventId, e);
      return List.of(); // return empty list if error
    }
  }

  /**
   * Add a user to the waitlist for an event
   */
  public static void addToWaitlist(String eventId, String email, WaitlistEntry entry) throws Exception {
    try {
      // don't need a return type
      Firestore db = FirebaseService.getFirestore();
      // get reference to the waitlist pool collection
      CollectionReference collectionRef = db.collection(WAITLIST_COLLECTION).document(eventId).collection(WAITLIST_POOL_COLLECTION);
      // add the entry to the waitlist pool collection
      collectionRef.add(entry).get(); // used to wait for an async operation to complete 

      logger.info("Added user {} to waitlist for event {}", email, eventId);
    } catch (Exception e) {
      logger.error("Error adding to waitlist for event: {}", eventId, e);
      throw new Exception("Failed to add to waitlist: " + e.getMessage(), e);
    }
  }

  /**
   * Remove a user from the waitlist
   */
  public static void removeFromWaitlist(String eventId, String email) throws Exception {
    try {
      Firestore db = FirebaseService.getFirestore();
      CollectionReference collectionRef = db.collection(WAITLIST_COLLECTION).document(eventId).collection(WAITLIST_POOL_COLLECTION);
      
      String emailHash = hashEmail(email);

      if(getWaitlistEntry(eventId, email).isEmpty()) {
        logger.warn("User {} is not on the waitlist for event {}", email, eventId);
        return;
      }

      // remove the entry from the waitlist pool collection
      collectionRef.document(emailHash).delete().get(); // used to wait for an async operation to complete 

      logger.info("Removed user {} from waitlist for event {}", emailHash, eventId);
    } catch (Exception e) {
      logger.error("Error removing from waitlist for event: {}", eventId, e);
      throw new Exception("Failed to remove from waitlist: " + e.getMessage(), e);
    }
  }

  /**
   * Check if a user is on the waitlist
   */
  public static Optional<WaitlistEntry> getWaitlistEntry(String eventId, String email) {
    try {
      // do we need to return if the user is on the waitlist? hmmm right now it returns a snapshot which 
      // is read-only and like a copy
      Firestore db = FirebaseService.getFirestore();
      CollectionReference collectionRef = db.collection(WAITLIST_COLLECTION).document(eventId).collection(WAITLIST_POOL_COLLECTION);
      String emailHash = hashEmail(email);
      DocumentSnapshot maybeSnapshot = collectionRef.document(emailHash).get().get();
      if (maybeSnapshot.exists()) {
        return Optional.of(maybeSnapshot.toObject(WaitlistEntry.class));
      }
      return Optional.empty();
    } catch (Exception e) {
      logger.error("Error checking waitlist entry for event: {}", eventId, e);
      return Optional.empty();
    }
  }

  /**
   * Update the notifiedAt timestamp for a waitlist entry
   */
  public static void updateNotifiedAt(String eventId, String email) throws Exception {
    try {
      Firestore db = FirebaseService.getFirestore();
      CollectionReference collectionRef = db.collection(WAITLIST_COLLECTION).document(eventId).collection(WAITLIST_POOL_COLLECTION);
      
      String emailHash = hashEmail(email);
      long now = System.currentTimeMillis();  // Current timestamp in milliseconds
      
      collectionRef.document(emailHash).update("notifiedAt", now).get();

      logger.info("Updated notifiedAt for user {} in waitlist for event {}", emailHash, eventId);
    } catch (Exception e) {
      logger.error("Error updating notifiedAt for event: {}", eventId, e);
      throw new Exception("Failed to update notifiedAt: " + e.getMessage(), e);
    }
  }

  /**
   * Hash an email address for use as a Firestore field key
   */
  public static String hashEmail(String email) throws NoSuchAlgorithmException {
    MessageDigest md = MessageDigest.getInstance("SHA-256"); // deterministic hashing function
    byte[] hash = md.digest(email.toLowerCase().trim().getBytes());
    StringBuilder hexString = new StringBuilder();
    for (byte b : hash) {
      String hex = Integer.toHexString(0xff & b);
      if (hex.length() == 1) {
        hexString.append('0');
      }
      hexString.append(hex);
    }
    return hexString.toString();
  }
}
