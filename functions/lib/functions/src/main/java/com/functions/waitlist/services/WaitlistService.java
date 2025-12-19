package com.functions.waitlist.services;

import com.functions.waitlist.models.WaitlistEntry;
import com.functions.waitlist.models.requests.JoinWaitlistRequest;
import com.functions.waitlist.models.responses.JoinWaitlistResponse;
import com.functions.waitlist.repositories.WaitlistRepository;

import java.util.List;
import java.util.Optional;

/**
 * Service layer for waitlist business logic.
 * - add person
 * - remove person
 * - update notifiedAt timestamp
 */
public class WaitlistService {
  public static JoinWaitlistResponse joinWaitlist(JoinWaitlistRequest request) {
    try {
      Optional<WaitlistEntry> entry = WaitlistRepository.getWaitlistEntry(request.getEventId(), request.getEmail());
      if (entry.isPresent()) {
        return JoinWaitlistResponse.builder()
          .success(false)
          .message("User already on waitlist")
          .build();
      }
      WaitlistEntry newEntry = WaitlistEntry.builder()
        .name(request.getName())
        .email(request.getEmail())
        .ticketCount(request.getTicketCount())
        .notifiedAt(null)
        .build();
      
      WaitlistRepository.addToWaitlist(request.getEventId(), request.getEmail(), newEntry);
      return JoinWaitlistResponse.builder()
        .success(true)
        .message("User added to waitlist")
        .build();
    } catch (Exception e) {
      return JoinWaitlistResponse.builder()
        .success(false)
        .message("Failed to add user to waitlist")
        .build();
    }
  }

  // remove the person from the waitlist
  public static boolean removeFromWaitlist(String eventId, String email) {
    try {
    Optional<WaitlistEntry> entry = WaitlistRepository.getWaitlistEntry(eventId, email);
    if (entry.isPresent()) { // if the entry is present, remove it from the waitlist
      WaitlistRepository.removeFromWaitlist(eventId, email);
      return true;
    }
      return false;
    } catch (Exception e) {
      return false;
    }
  }
  
  // notify the waitlist if not already notified within last 12 hours; changes the notifiedAt timestamp to the current time
  public static boolean notifyWaitlist(String eventId) {
    try {
      List<WaitlistEntry> entries = WaitlistRepository.getWaitlistByEventId(eventId);
      long now = System.currentTimeMillis();
      
      // for every person in the waitlist
      for (WaitlistEntry entry : entries) {
        // Skip if notified within last 12 hours
        if (entry.getNotifiedAt() != null && (now - entry.getNotifiedAt()) / 1000 < 60 * 60 * 12) {
          continue;
        }
        WaitlistRepository.updateNotifiedAt(eventId, entry.getEmail());      
      }
      return true;
    } catch (Exception e) {
      return false;
    }
  }
}
