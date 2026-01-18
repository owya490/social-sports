package com.functions.emails;

import java.io.IOException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.firebase.services.FirebaseService;
import com.functions.utils.TimeUtils;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;

/**
 * Service for sending emails related to events.
 * Handles waitlist confirmations, waitlist notifications, and purchase confirmations.
 */
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    private static final ZoneId SYDNEY_TIMEZONE = ZoneId.of("Australia/Sydney");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MM/dd/yyyy, HH:mm");

    /**
     * Sends an email confirmation to a user who has joined the waitlist for an event.
     * 
     * @param eventName The name of the event
     * @param name The name of the user who has joined the waitlist
     * @param eventLocation The location of the event
     * @param eventUrl The URL to the event
     * @param eventId The ID of the event
     * @param hashedEmail The hashed email of the user who has joined the waitlist
     * @param email      The email of the user who has joined the waitlist
     * @return true if email was sent successfully, false otherwise
     */
    public static boolean sendWaitlistEmailConfirmation(String eventName, String name, String eventLocation, String eventUrl, 
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
     * @param eventName The name of the event
     * @param name The name of the user who is on the waitlist
     * @param eventStartDate The start date of the event
     * @param eventEndDate The end date of the event
     * @param location The location of the event
     * @param email The email of the user who is on the waitlist
     * @return true if email was sent successfully, false otherwise
     */
    public static boolean sendWaitlistEmailNotification(String eventName, String name, Timestamp eventStartDate, Timestamp eventEndDate, 
        String location,String email) {
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
     * Sends a purchase confirmation email.
     * 
     * @param eventId The event ID
     * @param visibility Either "Private" or "Public"
     * @param email The recipient email
     * @param firstName The purchaser's first name
     * @param orderId The order ID
     * @return true if email was sent successfully, false otherwise
     */
    public static boolean sendPurchaseEmail(String eventId, String visibility, String email, String firstName, String orderId) {
        return sendPurchaseEmailWithRetries(eventId, visibility, email, firstName, orderId, 3);
    }
    
    /**
     * Sends a purchase confirmation email with retry logic.
     */
    private static boolean sendPurchaseEmailWithRetries(String eventId, String visibility, String email, 
                                                        String firstName, String orderId, int maxRetries) {
        for (int attempt = 0; attempt < maxRetries; attempt++) {
            try {
                if (sendPurchaseEmailInternal(eventId, visibility, email, firstName, orderId)) {
                    logger.info("Successfully sent purchase email for order {} to {} (attempt {}/{})", 
                               orderId, email, attempt + 1, maxRetries);
                    return true;
                }
            } catch (Exception e) {
                logger.error("Failed to send purchase email for order {} to {} (attempt {}/{}): {}", 
                           orderId, email, attempt + 1, maxRetries, e.getMessage(), e);
            }
            
            if (attempt < maxRetries - 1) {
                try {
                    long delay = (long) Math.pow(2, attempt) * 1000;
                    Thread.sleep(delay);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
        
        logger.warn("Failed to send purchase email after {} attempts for order {} to {}", 
                    maxRetries, orderId, email);
        return false;
    }
    
    /**
     * Internal implementation of sending purchase email.
     */
    private static boolean sendPurchaseEmailInternal(String eventId, String visibility, String email, 
                                                    String firstName, String orderId) throws ExecutionException, InterruptedException, IOException {
        Firestore db = FirebaseService.getFirestore();
        
        // Fetch Data
        DocumentSnapshot eventSnapshot = fetchDocument(db, "Events", "Active", visibility, eventId);
        if (!eventSnapshot.exists()) {
            logger.error("Unable to find event provided in datastore to send email. eventId={}", eventId);
            return false;
        }
        
        DocumentSnapshot orderSnapshot = fetchDocument(db, "Orders", orderId);
        if (!orderSnapshot.exists()) {
            logger.error("Unable to find orderId provided in datastore to send email. orderId={}", orderId);
            return false;
        }
        
        // Prepare Variables
        Map<String, String> variables = buildEmailVariables(eventSnapshot, orderSnapshot, firstName, orderId);
        
        // Send email to attendee using EmailClient
        boolean attendeeEmailSent = EmailClient.sendEmailWithLoopsWithRetries(EmailTemplateType.PURCHASE, email, variables);
        if (!attendeeEmailSent) {
            logger.error("Failed to send purchase email to attendee {}", email);
            return false;
        }
                          
        // Check and send email to organiser
        String organiserId = eventSnapshot.getString("organiserId");
        if (organiserId != null) {
            Optional<String> organiserEmail = getOrganiserEmailForTicketEmail(db, organiserId);
            organiserEmail.ifPresent(orgEmail -> {
                boolean organiserEmailSent = EmailClient.sendEmailWithLoopsWithRetries(EmailTemplateType.PURCHASE, orgEmail, variables);
                if (!organiserEmailSent) {
                    logger.error("Failed to send copy of purchase email to organiser {}", organiserId);
                }
            });
        }
        
        return true;
    }
    
    private static DocumentSnapshot fetchDocument(Firestore db, String... pathSegments) throws ExecutionException, InterruptedException {
        if (pathSegments == null || pathSegments.length == 0) {
            throw new IllegalArgumentException("Path segments cannot be null or empty");
        }
        if (pathSegments.length == 2) {
             return db.collection(pathSegments[0]).document(pathSegments[1]).get().get();
        } else if (pathSegments.length == 4) {
             return db.collection(pathSegments[0]).document(pathSegments[1])
                      .collection(pathSegments[2]).document(pathSegments[3]).get().get();
        }
        throw new IllegalArgumentException("Unsupported path segments length: " + pathSegments.length + ". Expected 2 or 4.");
    }
    
    private static Map<String, String> buildEmailVariables(DocumentSnapshot event, DocumentSnapshot order, String firstName, String orderId) {
        Timestamp startTimestamp = event.get("startDate", Timestamp.class);
        Timestamp endTimestamp = event.get("endDate", Timestamp.class);
        Timestamp purchasedTimestamp = order.get("datePurchased", Timestamp.class);
        
        Double price = event.getDouble("price");
        if (price == null) {
             Long priceLong = event.getLong("price");
             price = priceLong != null ? priceLong.doubleValue() : 0.0;
        }
        
        List<?> tickets = (List<?>) order.get("tickets");
        String quantity = tickets != null ? String.valueOf(tickets.size()) : "0";

        return Map.of(
            "name", Optional.ofNullable(firstName).orElse(""),
            "eventName", Optional.ofNullable(event.getString("name")).orElse(""),
            "orderId", Optional.ofNullable(orderId).orElse(""),
            "datePurchased", formatTimestamp(purchasedTimestamp),
            "quantity", quantity,
            "price", centsToDollars(price),
            "startDate", formatTimestamp(startTimestamp),
            "endDate", formatTimestamp(endTimestamp),
            "location", Optional.ofNullable(event.getString("location")).orElse("")
        );
    }

    private static String formatTimestamp(Timestamp timestamp) {
        if (timestamp == null) return "";
        ZonedDateTime zdt = ZonedDateTime.ofInstant(Instant.ofEpochSecond(timestamp.getSeconds(), timestamp.getNanos()), SYDNEY_TIMEZONE);
        return zdt.format(DATE_FORMATTER);
    }
    
    private static String centsToDollars(Double priceInCents) {
        if (priceInCents == null) return "$0.00";
        return String.format("$%.2f", priceInCents / 100.0);
    }
    
    private static Optional<String> getOrganiserEmailForTicketEmail(Firestore db, String organiserId) throws ExecutionException, InterruptedException {
        DocumentSnapshot organiserSnapshot = fetchDocument(db, "Users", "Active", "Private", organiserId);
                                               
        if (!organiserSnapshot.exists()) {
            logger.error("Organiser does not exist: organiserId={}", organiserId);
            return Optional.empty();
        }
        
        if (Boolean.TRUE.equals(organiserSnapshot.getBoolean("sendOrganiserTicketEmails"))) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> contactInfo = (Map<String, Object>) organiserSnapshot.get("contactInformation");
                if (contactInfo != null && contactInfo.get("email") instanceof String) {
                    return Optional.of((String) contactInfo.get("email"));
                }
            } catch (Exception e) {
                logger.error("Failed to find organiser email for sendOrganiserTicketEmail. organiserId={}", organiserId);
                throw new RuntimeException("Failed to find organiser email for sendOrganiserTicketEmail. organiserId=" + organiserId, e);
            }
        }
        
        return Optional.empty();
    }
}
