package com.functions.waitlist.services;

import com.functions.waitlist.models.WaitlistEntry;
import com.functions.waitlist.models.requests.JoinWaitlistRequest;
import com.functions.waitlist.models.responses.JoinWaitlistResponse;
import com.functions.waitlist.repositories.WaitlistRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

/**
 * Service layer for waitlist business logic 
 */
public class WaitlistService {
    private static final Logger logger = LoggerFactory.getLogger(WaitlistService.class);

    public static JoinWaitlistResponse joinWaitlist(JoinWaitlistRequest request) {
        try {
            Optional<WaitlistEntry> entry = WaitlistRepository.getWaitlistEntry(request.getEventId(), request.getEmail());
            String hashedEmail = WaitlistRepository.hashEmail(request.getEmail());
            if (entry.isPresent()) {
                logger.info("User {} already on waitlist for event {}", hashedEmail, request.getEventId());
                return JoinWaitlistResponse.builder()
                    .success(false)
                    .message("User already on waitlist")
                    .emailHash(hashedEmail)
                    .build();
            }
            WaitlistEntry newEntry = WaitlistEntry.builder()
                .name(request.getName())
                .email(request.getEmail())
                .ticketCount(request.getTicketCount())
                .notifiedAt(null)
                .build();
            
            WaitlistRepository.addToWaitlist(request.getEventId(), newEntry);
            logger.info("User {} successfully joined waitlist for event {}", hashedEmail, request.getEventId());
            return JoinWaitlistResponse.builder()
                .success(true)
                .message("User added to waitlist")
                .emailHash(hashedEmail)
                .build();
        } catch (Exception e) {
            logger.error("Failed to add user to waitlist for event {}", request.getEventId(), e);
            return JoinWaitlistResponse.builder()
                .success(false)
                .message("Failed to add user to waitlist")
                .build();
        }
    }

    // organiser removes attendee from waitlist
    public static boolean removeFromWaitlist(String eventId, String email) {
        try {

            WaitlistRepository.removeFromWaitlist(eventId, email);
            return true;
        } catch (Exception e) {
            logger.error("Failed to remove user {} from the waitlist for event {}", 
                email, eventId, e);
            return false;
        }
    }

    // attendee removes themselves from waitlist
    public static boolean removeFromWaitlistByHash(String eventId, String emailHash) {
        try {
            WaitlistRepository.removeFromWaitlistByHash(eventId, emailHash);
            return true;
        } catch (Exception e) {
            logger.error("Failed to remove user with hash {} from the waitlist for event {}", 
                emailHash, eventId, e);
            return false;
        }
    }
}
