package com.functions.waitlist.services;

import com.functions.waitlist.models.WaitlistEntry;
import com.functions.waitlist.models.requests.JoinWaitlistRequest;
import com.functions.waitlist.models.responses.JoinWaitlistResponse;
import com.functions.waitlist.repositories.WaitlistRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

/**
 * Service layer for waitlist business logic.
 * - add person
 * - remove person
 * - update notifiedAt timestamp
 */
public class WaitlistService {
  private static final Logger logger = LoggerFactory.getLogger(WaitlistService.class);

  public static JoinWaitlistResponse joinWaitlist(JoinWaitlistRequest request) {
    try {
      Optional<WaitlistEntry> entry = WaitlistRepository.getWaitlistEntry(request.getEventId(), request.getEmail());
      if (entry.isPresent()) {
        logger.info("User {} already on waitlist for event {}", request.getEmail(), request.getEventId());
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
      
      WaitlistRepository.addToWaitlist(request.getEventId(), newEntry);
      logger.info("User {} successfully joined waitlist for event {}", request.getEmail(), request.getEventId());
      return JoinWaitlistResponse.builder()
        .success(true)
        .message("User added to waitlist")
        .build();
    } catch (Exception e) {
      logger.error("Failed to add user {} to waitlist for event {}", 
        request.getEmail(), request.getEventId(), e);
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
      logger.error("Failed to remove user {} from the waitlist for event {}", 
        email, eventId, e);
      return false;
    }
  }
  
}
