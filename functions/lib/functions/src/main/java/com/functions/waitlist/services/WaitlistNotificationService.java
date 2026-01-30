package com.functions.waitlist.services;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import com.functions.emails.EmailService;
import com.functions.events.models.EventData;
import com.functions.events.repositories.EventsRepository;
import com.functions.waitlist.models.WaitlistEntry;
import com.functions.waitlist.repositories.WaitlistRepository;
import com.google.cloud.Timestamp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WaitlistNotificationService {
    private static final Logger logger = LoggerFactory.getLogger(WaitlistNotificationService.class);

    private static final long NOTIFICATION_DELAY_MS = 1000 * 60 * 60 * 12; // 12 hours

    /**
     * Notify all waitlists for all events.
     * 
     * @return NotificationResult with counts of notified and failed emails
     */
    public static NotificationResult notifyAllWaitlists() {
        // Get all event IDs that have waitlists
        List<String> eventIds = WaitlistRepository.getAllWaitlistEventIds();
        if (eventIds.isEmpty()) {
            logger.info("[WaitlistNotificationCronEndpoint] No waitlists found to process");
            return new NotificationResult(0, 0);
        }

        logger.info("[WaitlistNotificationCronEndpoint] Found {} waitlists to process", eventIds.size());

        // Track overall statistics
        int totalNotified = 0;
        int totalFailed = 0;
        int eventsProcessed = 0;
        int eventsSkipped = 0;
        List<String> failedEvents = new ArrayList<>();
        Instant notificationTime = Instant.now();

        // Process each waitlist
        for (String eventId : eventIds) {
            try {
                NotificationResult result = processWaitlistNotificationForEvent(eventId, notificationTime);
                totalNotified += result.notifiedCount;
                totalFailed += result.failedCount;
                eventsProcessed++;

                if (result.failedCount > 0) {
                    failedEvents.add(eventId);
                }
            } catch (Exception e) {
                eventsSkipped++;
                logger.error("[WaitlistNotificationService] Error processing waitlist for event: {}", eventId, e);
            }
        }

        // Build response
        String resultMessage = String.format(
                "Waitlist notification cron completed. Events processed: %d, Events skipped: %d, " +
                        "Total notified: %d, Total failed: %d",
                eventsProcessed, eventsSkipped, totalNotified, totalFailed);

        if (totalFailed == 0 && eventsSkipped == 0) {
            logger.info("[WaitlistNotificationService] {}", resultMessage);
        } else {
            logger.error("[WaitlistNotificationService] {} Failed events: {}", resultMessage, failedEvents);
        }

        return new NotificationResult(totalNotified, totalFailed);
    }

    /**
     * Process notifications for a single event's waitlist.
     * 
     * @param eventId          The event ID to process
     * @param notificationTime The timestamp to use for notifiedAt
     * @return NotificationResult with counts of notified and failed emails
     */
    private static NotificationResult processWaitlistNotificationForEvent(String eventId, Instant notificationTime) {
        int notifiedCount = 0;
        int failedCount = 0;

        // Fetch event details
        Optional<EventData> maybeEvent = EventsRepository.getEventById(eventId);
        if (maybeEvent.isEmpty()) {
            logger.warn("[WaitlistNotificationService] Event not found, skipping waitlist: {}", eventId);
            return new NotificationResult(0, 0);
        }

        EventData event = maybeEvent.get();

        // Skip inactive events
        if (event.getIsActive() == null || !event.getIsActive()) {
            logger.info("[WaitlistNotificationService] Skipping inactive event: {}", eventId);
            return new NotificationResult(0, 0);
        }

        if (!Boolean.TRUE.equals(event.getWaitlistEnabled())) {
            logger.info("[WaitlistNotificationService] Skipping event with waitlist disabled: {}", eventId);
            return new NotificationResult(0, 0);
        }

        // Skip events past registration deadline
        Timestamp registrationDeadline = event.getRegistrationDeadline();
        if (registrationDeadline != null) {
            Instant registrationEnd = Instant.ofEpochSecond(registrationDeadline.getSeconds(), registrationDeadline.getNanos());
            if (notificationTime.isAfter(registrationEnd)) {
                logger.info("[WaitlistNotificationService] Skipping event past registration deadline: {}", eventId);
                return new NotificationResult(0, 0);
            }
        } else {
            Timestamp startDate = event.getStartDate();
            if (startDate != null) {
                Instant startDateInstant = Instant.ofEpochSecond(startDate.getSeconds(), startDate.getNanos());
                if (notificationTime.isAfter(startDateInstant)) {
                    logger.info("[WaitlistNotificationService] Skipping event past start date: {}", eventId);
                    return new NotificationResult(0, 0);
                }
            } else {
                logger.info("[WaitlistNotificationService] Skipping event with no start date: {}", eventId);
                return new NotificationResult(0, 0);
            }
        } 

        // Skip events with no vacancy
        if (event.getVacancy() == null || event.getVacancy() <= 0) {
            logger.info("[WaitlistNotificationService] Skipping event with no vacancy: {}", eventId);
            return new NotificationResult(0, 0);
        }

        // Fetch waitlist entries for the event
        List<WaitlistEntry> waitlistEntries = WaitlistRepository.getWaitlistByEventId(eventId);
        if (waitlistEntries.isEmpty()) {
            logger.info("[WaitlistNotificationService] No waitlist entries for event: {}", eventId);
            return new NotificationResult(0, 0);
        }

        // Send notifications to users
        for (WaitlistEntry entry : waitlistEntries) {
            // Skip users who have already been notified less than 12 hours ago
            if (entry.getNotifiedAt() != null && (notificationTime.toEpochMilli() 
                - entry.getNotifiedAt().toDate().getTime() < NOTIFICATION_DELAY_MS)) {
                continue;
            }

            try {
                boolean emailSent = EmailService.sendWaitlistEmailNotification(
                        event.getName(),
                        entry.getName(),
                        event.getStartDate(),
                        event.getEndDate(),
                        event.getLocation(),
                        entry.getEmail(),
                        eventId
                    );

                if (emailSent) {
                    // Update notifiedAt timestamp
                    WaitlistRepository.updateNotifiedAt(eventId, entry.getEmail(), notificationTime);
                    notifiedCount++;
                    logger.info("[WaitlistNotificationService] Successfully notified user: {} for event: {}",
                            entry.getEmail(), eventId);
                } else {
                    failedCount++;
                    logger.error("[WaitlistNotificationService] Failed to send email to: {} for event: {}",
                            entry.getEmail(), eventId);
                }
            } catch (Exception e) {
                failedCount++;
                logger.error("[WaitlistNotificationService] Error notifying user: {} for event: {}",
                        entry.getEmail(), eventId, e);
            }
        }

        return new NotificationResult(notifiedCount, failedCount);
    }

    /**
     * Simple record to hold notification results for an event.
     */
    public record NotificationResult(int notifiedCount, int failedCount) {
    }
}
