package com.functions.emails;

import java.time.ZoneId;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventData;
import com.functions.tickets.models.Order;
import com.functions.utils.TimeUtils;
import com.google.cloud.Timestamp;

public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    /**
     * Sends an email confirmation to a user who has joined the waitlist for an
     * event.
     * 
     * @param eventName     The name of the event
     * @param name          The name of the user who has joined the waitlist
     * @param eventLocation The location of the event
     * @param eventUrl      The URL to the event
     * @param eventId       The ID of the event
     * @param hashedEmail   The hashed email of the user who has joined the waitlist
     * @param email         The email of the user who has joined the waitlist
     * @return true if email was sent successfully, false otherwise
     */
    public static boolean sendWaitlistEmailConfirmation(String eventName, String name, String eventLocation,
            String eventUrl,
            String eventId, String hashedEmail, String email) {
        Map<String, String> variables = Map.of(
                "name", name,
                "eventName", eventName,
                "location", eventLocation,
                "eventUrl", eventUrl,
                "eventId", eventId,
                "hashedEmail", hashedEmail);

        logger.info("Sending waitlist email confirmation to {} for event {}", email, eventName);
        return EmailClient.sendEmailWithLoopsWithRetries(EmailTemplateType.WAITLIST_CONFIRMATION, email, variables);
    }

    /**
     * Sends an email notifications to everyone on the waitlist for an event.
     * 
     * @param eventName      The name of the event
     * @param name           The name of the user who is on the waitlist
     * @param eventStartDate The start date of the event
     * @param eventEndDate   The end date of the event
     * @param location       The location of the event
     * @param email          The email of the user who is on the waitlist
     * @return true if email was sent successfully, false otherwise
     */
    public static boolean sendWaitlistEmailNotification(String eventName, String name, Timestamp eventStartDate,
            Timestamp eventEndDate,
            String location, String email) {
        Map<String, String> variables = Map.of(
                "name", name,
                "eventName", eventName,
                "startDate", TimeUtils.getTimestampStringFromTimezone(eventStartDate, ZoneId.of("Australia/Sydney")),
                "endDate", TimeUtils.getTimestampStringFromTimezone(eventEndDate, ZoneId.of("Australia/Sydney")),
                "location", location);
        logger.info("Sending waitlist email notification to {} for event {}", email, eventName);
        return EmailClient.sendEmailWithLoopsWithRetries(EmailTemplateType.WAITLIST_NOTIFICATION, email, variables);
    }

    /**
     * Sends a purchase confirmation email to a user who has purchased tickets.
     * This is the same email template used by the Python purchase_event.py.
     * 
     * @param order     The order data
     * @param eventData The event data
     * @return true if email was sent successfully, false otherwise
     */
    public static boolean sendPurchaseConfirmationEmail(Order order, EventData eventData) {
        try {
            String email = order.getEmail();
            String fullName = order.getFullName();
            // Extract first name from full name (same as Python uses first_name)
            String firstName = fullName != null && fullName.contains(" ")
                    ? fullName.split(" ")[0]
                    : fullName;

            String datePurchasedString = TimeUtils.formatTimestampForEmail(order.getDatePurchased());
            String startDateString = TimeUtils.formatTimestampForEmail(eventData.getStartDate());
            String endDateString = TimeUtils.formatTimestampForEmail(eventData.getEndDate());
            int priceInCents = eventData.getPrice() != null ? eventData.getPrice() : 0;
            String priceInDollars = String.valueOf(priceInCents / 100.0);

            Map<String, String> variables = Map.of(
                    "name", firstName,
                    "eventName", eventData.getName(),
                    "orderId", order.getOrderId(),
                    "datePurchased", datePurchasedString,
                    "quantity", String.valueOf(order.getTickets().size()),
                    "price", priceInDollars,
                    "startDate", startDateString,
                    "endDate", endDateString,
                    "location", eventData.getLocation());

            logger.info("Sending purchase confirmation email to {} for event {} with orderId {}", email,
                    eventData.getName(), order.getOrderId());
            return EmailClient.sendEmailWithLoopsWithRetries(EmailTemplateType.PURCHASE, email, variables);
        } catch (Exception e) {
            logger.error("Error sending purchase confirmation email for orderId: {}", order.getOrderId(), e);
            return false;
        }
    }

}
