package com.functions.waitlist.handlers;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.emails.EmailService;
import com.functions.events.models.EventData;
import com.functions.events.repositories.EventsRepository;
import com.functions.waitlist.models.WaitlistEntry;
import com.functions.waitlist.repositories.WaitlistRepository;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

/**
 * Cron endpoint that sends waitlist notification emails to ALL waitlists.
 * Processes all events with waitlists and notifies users who haven't been notified yet.
 */
public class WaitlistNotificationCronEndpoint implements HttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(WaitlistNotificationCronEndpoint.class);
    
    private static final long NOTIFICATION_DELAY_MS = 1000 * 60 * 60 * 12; // 12 hours

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        // Set CORS headers for all responses
        response.appendHeader("Access-Control-Allow-Origin", "*");
        response.appendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.appendHeader("Access-Control-Max-Age", "3600"); // Cache preflight for 1 hour

        // Handle preflight (OPTIONS) requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatusCode(204); // No Content
            return;
        }

        if (!(request.getMethod().equalsIgnoreCase("GET"))) {
            response.setStatusCode(405); // Method Not Allowed
            response.appendHeader("Allow", "GET");
            response.getWriter().write("The WaitlistNotificationCronEndpoint only supports GET requests.");
            return;
        }

        logger.info("[WaitlistNotificationCronEndpoint] Starting waitlist notification cron job");

        // Get all event IDs that have waitlists
        List<String> eventIds = WaitlistRepository.getAllWaitlistEventIds();
        if (eventIds.isEmpty()) {
            logger.info("[WaitlistNotificationCronEndpoint] No waitlists found to process");
            response.setStatusCode(200);
            response.getWriter().write("No waitlists found to process.");
            return;
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
                logger.error("[WaitlistNotificationCronEndpoint] Error processing waitlist for event: {}", eventId, e);
            }
        }

        // Build response
        String resultMessage = String.format(
                "Waitlist notification cron completed. Events processed: %d, Events skipped: %d, " +
                "Total notified: %d, Total failed: %d",
                eventsProcessed, eventsSkipped, totalNotified, totalFailed);

        if (totalFailed == 0 && eventsSkipped == 0) {
            logger.info("[WaitlistNotificationCronEndpoint] {}", resultMessage);
            response.setStatusCode(200);
        } else {
            logger.warn("[WaitlistNotificationCronEndpoint] {} Failed events: {}", resultMessage, failedEvents);
            response.setStatusCode(207); // Multi-Status - partial success
        }

        response.getWriter().write(resultMessage);
    }

    /**
     * Process notifications for a single event's waitlist.
     * 
     * @param eventId          The event ID to process
     * @param notificationTime The timestamp to use for notifiedAt
     * @return NotificationResult with counts of notified and failed emails
     */
    private NotificationResult processWaitlistNotificationForEvent(String eventId, Instant notificationTime) {
        int notifiedCount = 0;
        int failedCount = 0;

        // Fetch event details
        Optional<EventData> maybeEvent = EventsRepository.getEventById(eventId);
        if (maybeEvent.isEmpty()) {
            logger.warn("[WaitlistNotificationCronEndpoint] Event not found, skipping waitlist: {}", eventId);
            return new NotificationResult(0, 0);
        }

        EventData event = maybeEvent.get();

        // Skip inactive events
        if (event.getIsActive() == null || !event.getIsActive()) {
            logger.debug("[WaitlistNotificationCronEndpoint] Skipping inactive event: {}", eventId);
            return new NotificationResult(0, 0);
        }

        if (!Boolean.TRUE.equals(event.getWaitlistEnabled())) {
            logger.debug("[WaitlistNotificationCronEndpoint] Skipping event with waitlist disabled: {}", eventId);
            return new NotificationResult(0, 0);
        }

        // Fetch waitlist entries for the event
        List<WaitlistEntry> waitlistEntries = WaitlistRepository.getWaitlistByEventId(eventId);
        if (waitlistEntries.isEmpty()) {
            logger.debug("[WaitlistNotificationCronEndpoint] No waitlist entries for event: {}", eventId);
            return new NotificationResult(0, 0);
        }

        // Send notifications to users 
        for (WaitlistEntry entry : waitlistEntries) {
            // Skip users who have already been notified less than 12 hours ago
            if (entry.getNotifiedAt() != null && (entry.getNotifiedAt().toDate().getTime() - notificationTime.toEpochMilli() < NOTIFICATION_DELAY_MS)) {
                continue;
            }

            try {
                boolean emailSent = EmailService.sendWaitlistEmailNotification(
                        event.getName(),
                        entry.getName(),
                        event.getStartDate(),
                        event.getEndDate(),
                        event.getLocation(),
                        entry.getEmail());

                if (emailSent) {
                    // Update notifiedAt timestamp
                    WaitlistRepository.updateNotifiedAt(eventId, entry.getEmail(), notificationTime);
                    notifiedCount++;
                    logger.info("[WaitlistNotificationCronEndpoint] Successfully notified user: {} for event: {}",
                            entry.getEmail(), eventId);
                } else {
                    failedCount++;
                    logger.error("[WaitlistNotificationCronEndpoint] Failed to send email to: {} for event: {}",
                            entry.getEmail(), eventId);
                }
            } catch (Exception e) {
                failedCount++;
                logger.error("[WaitlistNotificationCronEndpoint] Error notifying user: {} for event: {}",
                        entry.getEmail(), eventId, e);
            }
        }

        return new NotificationResult(notifiedCount, failedCount);
    }

    /**
     * Simple record to hold notification results for an event.
     */
    private record NotificationResult(int notifiedCount, int failedCount) {}
}
