package com.functions.waitlist.services;

import com.functions.events.models.EventData;
import com.functions.events.repositories.EventsRepository;
import com.functions.waitlist.models.WaitlistEntry;
import com.functions.waitlist.repositories.WaitlistRepository;

import org.apache.commons.validator.routines.EmailValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

/**
 * Service layer for waitlist business logic 
 */
public class WaitlistService {
    private static final Logger logger = LoggerFactory.getLogger(WaitlistService.class);

    public static void joinEventWaitlist(String eventId, String email, String name, Integer ticketCount) {
        try {
            Optional<WaitlistEntry> entry = WaitlistRepository.getWaitlistEntry(eventId, email);
            String hashedEmail = WaitlistRepository.hashEmail(email);
            if (entry.isPresent()) {
                logger.info("User {} ({}) already on waitlist for event {}", email, hashedEmail, eventId);
                return;
            }
            WaitlistEntry newEntry = WaitlistEntry.builder()
                .name(name)
                .email(email)
                .ticketCount(ticketCount)
                .notifiedAt(null)
                .build();
            WaitlistRepository.addToWaitlist(eventId, newEntry);
            logger.info("User {} ({}) successfully joined waitlist for event {}", email, hashedEmail, eventId);
        } catch (Exception e) {
            logger.error("Failed to add user {} to waitlist for event {}", email, eventId, e);
            throw new RuntimeException("Failed to add user to waitlist for event " + eventId, e);
        }
    }

    public static boolean validateWaitlistEntry(String eventId, String email, String name, Integer ticketCount) {
        if (email == null || email.isEmpty() || !EmailValidator.getInstance().isValid(email)) {
            return false;
        }
        if (name == null || name.isEmpty()) {
            return false;
        }
        if (ticketCount == null || ticketCount <= 0) {
            return false;
        }
        if (eventId == null || eventId.isEmpty()) {
            return false;
        }
        EventData eventData = EventsRepository.getEventById(eventId).orElse(null);
        if (eventData == null) {
            return false;
        }
        if (eventData.getWaitlistEnabled() == false) {
            return false;
        }
        return true;
    }

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
