package com.functions.emails;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
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
import com.functions.firebase.services.FirebaseService.CollectionPaths;
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
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy, HH:mm");

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
        try {
            boolean result = sendPurchaseEmailInternal(eventId, visibility, email, firstName, orderId);
            if (result) {
                logger.info("Successfully sent purchase email for order {} to {}", orderId, email);
            } else {
                logger.warn("Failed to send purchase email for order {} to {}", orderId, email);
            }
            return result;
        } catch (Exception e) {
            logger.error("Failed to send purchase email for order {} to {}: {}", 
                       orderId, email, e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Internal implementation of sending purchase email.
     */
    private static boolean sendPurchaseEmailInternal(String eventId, String visibility, String email, 
                                                    String firstName, String orderId) throws ExecutionException, InterruptedException, IOException {
        Firestore db = FirebaseService.getFirestore();
        
        // Fetch Data
        DocumentSnapshot eventSnapshot = fetchDocument(db, CollectionPaths.EVENTS, CollectionPaths.ACTIVE, visibility, eventId);
        if (!eventSnapshot.exists()) {
            logger.error("Unable to find event provided in datastore to send email. eventId={}", eventId);
            return false;
        }
        
        DocumentSnapshot orderSnapshot = fetchDocument(db, CollectionPaths.ORDERS, orderId);
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
        
        // Robustly extract price from Firestore, handling various numeric types
        double priceInCents = extractPrice(event);
        
        List<?> tickets = (List<?>) order.get("tickets");
        String quantity = tickets != null ? String.valueOf(tickets.size()) : "0";

        return Map.of(
            "name", Optional.ofNullable(firstName).orElse(""),
            "eventName", Optional.ofNullable(event.getString("name")).orElse(""),
            "orderId", Optional.ofNullable(orderId).orElse(""),
            "datePurchased", formatTimestamp(purchasedTimestamp),
            "quantity", quantity,
            "price", centsToDollars(priceInCents),
            "startDate", formatTimestamp(startTimestamp),
            "endDate", formatTimestamp(endTimestamp),
            "location", Optional.ofNullable(event.getString("location")).orElse("")
        );
    }
    
    /**
     * Extracts price from a Firestore document, handling multiple possible types.
     * 
     * @param event The event document snapshot
     * @return The price in cents as a double, or 0.0 if not found or invalid
     */
    private static double extractPrice(DocumentSnapshot event) {
        Object priceObj = event.get("price");
        
        if (priceObj == null) {
            return 0.0;
        }
        
        // Handle different numeric types
        if (priceObj instanceof Double) {
            return (Double) priceObj;
        } else if (priceObj instanceof Long) {
            return ((Long) priceObj).doubleValue();
        } else if (priceObj instanceof Integer) {
            return ((Integer) priceObj).doubleValue();
        } else if (priceObj instanceof String) {
            try {
                return Double.parseDouble((String) priceObj);
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse price string '{}', defaulting to 0.0", priceObj);
                return 0.0;
            }
        } else {
            logger.warn("Unexpected price type '{}', defaulting to 0.0", priceObj.getClass().getName());
            return 0.0;
        }
    }

    private static String formatTimestamp(Timestamp timestamp) {
        if (timestamp == null) return "";
        // Use TimeUtils conversion pattern for consistency, then apply email-specific format
        Instant instant = timestamp.toSqlTimestamp().toInstant();
        ZonedDateTime zdt = instant.atZone(SYDNEY_TIMEZONE);
        return zdt.format(DATE_FORMATTER);
    }
    
    private static String centsToDollars(Double priceInCents) {
        if (priceInCents == null) return "$0.00";
        
        // Use BigDecimal for precise decimal arithmetic to avoid floating-point errors
        BigDecimal cents = BigDecimal.valueOf(priceInCents);
        BigDecimal dollars = cents.divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        return "$" + dollars.toPlainString();
    }
    
    private static Optional<String> getOrganiserEmailForTicketEmail(Firestore db, String organiserId) throws ExecutionException, InterruptedException {
        DocumentSnapshot organiserSnapshot = fetchDocument(db, CollectionPaths.USERS, CollectionPaths.ACTIVE, CollectionPaths.PRIVATE, organiserId);
                                               
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
