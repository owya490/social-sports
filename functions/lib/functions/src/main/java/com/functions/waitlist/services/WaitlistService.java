package com.functions.waitlist.services;

import com.functions.waitlist.models.WaitlistEntry;
import com.functions.waitlist.repositories.WaitlistRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

/**
 * Service layer for waitlist business logic 
 */
public class WaitlistService {
    private static final Logger logger = LoggerFactory.getLogger(WaitlistService.class);

    public static void updateFulfilfmentEntityWithWaitlistData(String email, String name, String eventId, Integer ticketCount) {
        try {
            Optional<WaitlistEntry> entry = WaitlistRepository.getWaitlistEntry(eventId, email);
            String hashedEmail = WaitlistRepository.hashEmail(email);
            if (entry.isPresent()) {
                logger.info("User {} already on waitlist for event {}", hashedEmail, eventId);
                return;
            }
            WaitlistEntry newEntry = WaitlistEntry.builder()
                .name(name)
                .email(email)
                .ticketCount(ticketCount)
                .notifiedAt(null)
                .build();
            WaitlistRepository.addToWaitlist(eventId, newEntry);
            logger.info("User {} successfully joined waitlist for event {}", hashedEmail, eventId);
        } catch (Exception e) {
            logger.error("Failed to add user to waitlist for event {}", eventId, e);
            throw new RuntimeException("Failed to add user to waitlist for event " + eventId, e);
        }
    }


    // public string moveFulfilmentEntityWaitlistDatatoWaitlistTable()
    // // organiser removes attendee from waitlist
    // public static boolean removeFromWaitlist(String eventId, String email) {
    //     try {

    //         WaitlistRepository.removeFromWaitlist(eventId, email);
    //         return true;
    //     } catch (Exception e) {
    //         logger.error("Failed to remove user {} from the waitlist for event {}", 
    //             email, eventId, e);
    //         return false;
    //     }
    // }

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
