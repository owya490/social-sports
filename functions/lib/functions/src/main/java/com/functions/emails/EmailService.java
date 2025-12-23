package com.functions.emails;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

import com.google.cloud.Timestamp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MM/dd/yyyy, HH:mm");
    private static final ZoneId SYDNEY_TIMEZONE = ZoneId.of("Australia/Sydney");

    /**
     * Sends an email confirmation to a user who has joined the waitlist for an event.
     * 
     * @param eventId    The event ID
     * @param email      The email of the user who has joined the waitlist
     * @return true if email was sent successfully, false otherwise
     */
    public static boolean sendWaitlistEmailConfirmation(String eventName, String name, String eventLocation, String eventUrl, 
        String eventId, String hashedEmail, String email, int maxRetries) {
        Map<String, String> variables = Map.of(
            "name", name,
            "eventName", eventName,
            "location", eventLocation,
            "eventUrl", eventUrl, 
            "eventId", eventId, 
            "hashedEmail", hashedEmail);


        logger.info("Sending waitlist email confirmation to {} for event {}", email, eventName);
        return EmailClient.sendEmailWithLoopWithRetries(EmailClient.WAITLIST_CONFIRMATION_EMAIL_ID, email, variables, maxRetries);
    }


    /**
     * Sends an email notifications to everyone on the waitlist for an event.
     * 
     * @param eventId    The event ID
     * @return true if email was sent successfully, false otherwise
     */
    public static boolean sendWaitlistEmailNotification(String eventName, String name, Timestamp eventStartDate, Timestamp eventEndDate, 
        String location, String unregisterUrl,String email, int maxRetries) {
        Map<String, String> variables = Map.of(
            "name", name, 
            "eventName", eventName,
            "startDate", formatTimestamp(eventStartDate),
            "endDate", formatTimestamp(eventEndDate),
            "location", location);


        logger.info("Sending waitlist email notification to {} for event {}", email, eventName);
        return EmailClient.sendEmailWithLoopWithRetries(EmailClient.WAITLIST_NOTIFICATION_EMAIL_ID, email, variables, maxRetries);
    }
    
    /**
     * Formats a Firestore Timestamp to a readable date string in Sydney timezone.
     */
    private static String formatTimestamp(Timestamp timestamp) {
        if (timestamp == null) return "";
        ZonedDateTime zdt = ZonedDateTime.ofInstant(
            Instant.ofEpochSecond(timestamp.getSeconds(), timestamp.getNanos()), 
            SYDNEY_TIMEZONE
        );

        return zdt.format(DATE_FORMATTER);
    }
}
