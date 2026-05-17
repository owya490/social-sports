package com.functions.waitlist.services;

import com.functions.events.models.EventData;
import com.functions.events.repositories.EventsRepository;
import com.functions.waitlist.models.WaitlistEntry;
import com.functions.waitlist.repositories.WaitlistRepository;

import org.apache.commons.validator.routines.EmailValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.emails.EmailService;
import com.google.cloud.Timestamp;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Service layer for waitlist business logic 
 */
public class WaitlistService {
    private static final Logger logger = LoggerFactory.getLogger(WaitlistService.class);
    private static final Duration WAITLIST_NOTIFICATION_COOLDOWN = Duration.ofHours(24);

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
        if (!Boolean.TRUE.equals(eventData.getWaitlistEnabled())) {
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

    public static int processWaitlistNotificationsForAllEvents() {
        List<EventData> events = EventsRepository.getActivePublicEventsWithWaitlistEnabled();
        int notifiedCount = 0;

        for (EventData eventData : events) {
            notifiedCount += processWaitlistNotificationsForEvent(eventData.getEventId());
        }

        logger.info("Completed waitlist notification run. Total notifications sent: {}", notifiedCount);
        return notifiedCount;
    }

    public static int processWaitlistNotificationsForEvent(String eventId) {
        EventData eventData = EventsRepository.getEventById(eventId).orElse(null);
        if (eventData == null || !Boolean.TRUE.equals(eventData.getWaitlistEnabled())) {
            return 0;
        }

        Integer vacancy = eventData.getVacancy();
        if (vacancy == null || vacancy <= 0) {
            return 0;
        }

        List<WaitlistEntry> waitlistEntries = WaitlistRepository.getWaitlistByEventId(eventId);
        if (waitlistEntries.isEmpty()) {
            return 0;
        }

        Instant now = Instant.now();
        int notifiedCount = 0;
        for (WaitlistEntry entry : waitlistEntries) {
            if (entry.getEmail() == null || entry.getEmail().isBlank()) {
                continue;
            }
            if (isWithinCooldown(entry.getNotifiedAt(), now)) {
                continue;
            }

            boolean sent = EmailService.sendWaitlistEmailNotification(
                    eventData.getName(),
                    entry.getName(),
                    eventData.getStartDate(),
                    eventData.getEndDate(),
                    eventData.getLocation(),
                    entry.getEmail());
            if (!sent) {
                logger.warn("Failed to send waitlist notification for eventId={}, email={}", eventId, entry.getEmail());
                continue;
            }

            try {
                WaitlistRepository.updateNotifiedAt(eventId, entry.getEmail(), now);
                notifiedCount++;
            } catch (Exception e) {
                logger.error("Failed to update notifiedAt for eventId={}, email={}", eventId, entry.getEmail(), e);
            }
        }

        return notifiedCount;
    }

    public static void removeUserFromWaitlistIfBooked(String eventId, String email) {
        if (eventId == null || eventId.isBlank() || email == null || email.isBlank()) {
            return;
        }

        try {
            WaitlistRepository.removeFromWaitlist(eventId, email);
            String hashedEmail = WaitlistRepository.hashEmail(email);
            logger.info("Removed booked user from waitlist if present. eventId={}, emailHash={}", eventId, hashedEmail);
        } catch (Exception e) {
            logger.warn("Failed to remove booked user from waitlist. eventId={}", eventId, e);
        }
    }

    private static boolean isWithinCooldown(Timestamp notifiedAt, Instant now) {
        if (notifiedAt == null) {
            return false;
        }
        Instant lastNotified = Instant.ofEpochSecond(notifiedAt.getSeconds(), notifiedAt.getNanos());
        return lastNotified.plus(WAITLIST_NOTIFICATION_COOLDOWN).isAfter(now);
    }
}
