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
     * @param eventName The name of the event
     * @param name The name of the user who has joined the waitlist
     * @param eventLocation The location of the event
     * @param eventUrl The URL to the event
     * @param hashedEmail The hashed email of the user who has joined the waitlist
     * @param email      The email of the user who has joined the waitlist
     * @param maxRetries The maximum number of retries to send the email
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
        return EmailClient.sendEmailWithLoopWithRetries(EmailTemplateType.WAITLIST_CONFIRMATION.getTransactionalId(), email, variables, maxRetries);
    }


    /**
     * Sends an email notifications to everyone on the waitlist for an event.
     * 
     * @param eventName The name of the event
     * @param name The name of the user who is on the waitlist
     * @param eventStartDate The start date of the event
     * @param eventEndDate The end date of the event
     * @param location The location of the event
     * @param email The email of the user who is on the waitlist
     * @param maxRetries The maximum number of retries to send the email
     * @return true if email was sent successfully, false otherwise
     */
    public static boolean sendWaitlistEmailNotification(String eventName, String name, Timestamp eventStartDate, Timestamp eventEndDate, 
        String location,String email, int maxRetries) {
        Map<String, String> variables = Map.of(
            "name", name, 
            "eventName", eventName,
            "startDate", formatTimestamp(eventStartDate),
            "endDate", formatTimestamp(eventEndDate),
            "location", location);


        logger.info("Sending waitlist email notification to {} for event {}", email, eventName);
        return EmailClient.sendEmailWithLoopWithRetries(EmailTemplateType.WAITLIST_NOTIFICATION.getTransactionalId(), email, variables, maxRetries);
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
