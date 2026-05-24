package com.functions.emails;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.firebase.services.FirebaseService;
import com.functions.firebase.services.FirebaseService.CollectionPaths;
import com.functions.global.handlers.Global;
import com.functions.utils.TimeUtils;
import com.functions.utils.UrlUtils;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;

/**
 * Service for sending emails related to events.
 * Handles waitlist confirmations, waitlist notifications, and purchase confirmations.
 */
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private static final String DEFAULT_LOOPS_PAYMENT_CANCELLED_EMAIL_TEMPLATE_ID = "cml0rm3t21e8s0ixa21rvcfnx";
    private static final String LOOPS_PAYMENT_CANCELLED_EMAIL_TEMPLATE_ID_ENV_VAR =
            "LOOPS_PAYMENT_CANCELLED_EMAIL_TEMPLATE_ID";

    /** Sentinel value used as a default for template IDs not yet created in Loops. */
    static final String PLACEHOLDER_TEMPLATE_ID = "REPLACE_ME_TODO";

    @FunctionalInterface
    interface PurchaseEmailSender {
        boolean send(EmailTemplateType templateType, String email, Map<String, String> variables);
    }
    private static final String LOOPS_PAYMENT_CANCELLED_EMAIL_TEMPLATE_ID =
            resolveTemplateIdWithDefault(Global.getEnv(LOOPS_PAYMENT_CANCELLED_EMAIL_TEMPLATE_ID_ENV_VAR),
                    DEFAULT_LOOPS_PAYMENT_CANCELLED_EMAIL_TEMPLATE_ID);

    private static String resolveTemplateIdWithDefault(String configuredTemplateId, String defaultTemplateId) {
        if (configuredTemplateId == null || configuredTemplateId.isBlank()) {
            return defaultTemplateId;
        }
        return configuredTemplateId;
    }

    /**
     * Returns true when a template ID has not yet been replaced with a real Loops ID.
     * Methods should skip sending and log a warning in this case.
     */
    private static boolean isPlaceholderTemplateId(String templateId) {
        return PLACEHOLDER_TEMPLATE_ID.equals(templateId);
    }

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
            Firestore db = FirebaseService.getFirestore();

            DocumentSnapshot eventSnapshot = fetchNestedDocument(
                    db,
                    CollectionPaths.EVENTS,
                    CollectionPaths.ACTIVE,
                    visibility,
                    eventId);
            if (!eventSnapshot.exists()) {
                logger.error("Unable to find event provided in datastore to send email. eventId={}", eventId);
                return false;
            }

            DocumentSnapshot orderSnapshot = fetchRootDocument(db, CollectionPaths.ORDERS, orderId);
            if (!orderSnapshot.exists()) {
                logger.error("Unable to find orderId provided in datastore to send email. orderId={}", orderId);
                return false;
            }

            Map<String, String> variables = buildEmailVariables(eventSnapshot, orderSnapshot, firstName, orderId);

            boolean attendeeEmailSent = EmailClient.sendEmailWithLoopsWithRetries(
                    EmailTemplateType.PURCHASE,
                    email,
                    variables);
            if (!attendeeEmailSent) {
                logger.warn("Failed to send purchase email for order {} to {}", orderId, email);
                return false;
            }

            String organiserId = eventSnapshot.getString("organiserId");
            if (organiserId != null) {
                Optional<String> organiserEmail = getOrganiserEmailForTicketEmail(db, organiserId);
                if (!sendPurchaseEmailCopyToOrganiser(
                        organiserEmail,
                        organiserId,
                        variables,
                        EmailClient::sendEmailWithLoopsWithRetries)) {
                    logger.warn("Purchase email was sent to attendee {}, but organiser copy failed for orderId={}",
                            email, orderId);
                }
            } else {
                logger.warn("Purchase email was sent to attendee {}, but event {} has no organiserId", email, eventId);
            }

            logger.info("Successfully sent purchase email for order {} to {}", orderId, email);
            return true;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            logger.warn("Purchase email send interrupted for order {} to {}", orderId, email, e);
            return false;
        } catch (Exception e) {
            logger.error("Failed to send purchase email for order {} to {}: {}",
                    orderId, email, e.getMessage(), e);
            return false;
        }
    }

    private static DocumentSnapshot fetchRootDocument(Firestore db, String collectionPath, String documentId)
            throws ExecutionException, InterruptedException {
        return db.collection(collectionPath).document(documentId).get().get();
    }

    private static DocumentSnapshot fetchNestedDocument(
            Firestore db,
            String parentCollectionPath,
            String parentDocumentId,
            String childCollectionPath,
            String childDocumentId) throws ExecutionException, InterruptedException {
        return db.collection(parentCollectionPath)
                .document(parentDocumentId)
                .collection(childCollectionPath)
                .document(childDocumentId)
                .get()
                .get();
    }

    private static Map<String, String> buildEmailVariables(DocumentSnapshot event, DocumentSnapshot order, String firstName, String orderId) {
        Timestamp startTimestamp = getTimestampField(event, "startDate");
        Timestamp endTimestamp = getTimestampField(event, "endDate");
        Timestamp purchasedTimestamp = getTimestampField(order, "datePurchased");

        // Robustly extract price from Firestore, handling various numeric types
        double priceInCents = extractPrice(event);

        List<?> tickets = (List<?>) order.get("tickets");
        String quantity = tickets != null ? String.valueOf(tickets.size()) : "0";

        return buildPurchaseEmailVariables(
                firstName,
                event.getString("name"),
                orderId,
                quantity,
                priceInCents,
                TimeUtils.formatTimestampForEmail(purchasedTimestamp),
                TimeUtils.formatTimestampForEmail(startTimestamp),
                TimeUtils.formatTimestampForEmail(endTimestamp),
                event.getString("location"));
    }

    private static Timestamp getTimestampField(DocumentSnapshot snapshot, String fieldName) {
        Object value = snapshot.get(fieldName);
        if (value == null) {
            logger.error("Missing required timestamp field '{}'", fieldName);
            throw new IllegalStateException("Missing required timestamp field: " + fieldName);
        }

        if (value instanceof Timestamp timestamp) {
            return timestamp;
        }

        logger.error("Unexpected timestamp type '{}' for field '{}'",
                value.getClass().getName(), fieldName);
        throw new IllegalStateException(
                "Unexpected timestamp type for field " + fieldName + ": " + value.getClass().getName());
    }

    /**
     * Extracts price from a Firestore document, handling multiple possible types.
     *
     * @param event The event document snapshot
     * @return The price in cents as a double, or 0.0 if not found or invalid
     */
    private static double extractPrice(DocumentSnapshot event) {
        Long longPrice = event.getLong("price");
        if (longPrice != null) {
            return longPrice.doubleValue();
        }

        Double doublePrice = event.getDouble("price");
        if (doublePrice != null) {
            return doublePrice;
        }

        Object priceObj = event.get("price");

        if (priceObj == null) {
            return 0.0;
        }

        if (priceObj instanceof Number numericPrice) {
            return numericPrice.doubleValue();
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

    private static Map<String, String> buildPurchaseEmailVariables(
            String firstName,
            String eventName,
            String orderId,
            String quantity,
            Double priceInCents,
            String datePurchased,
            String startDate,
            String endDate,
            String location) {
        String resolvedFirstName = defaultString(firstName);
        String resolvedEventName = defaultString(eventName);
        String resolvedOrderId = defaultString(orderId);
        String resolvedDatePurchased = defaultString(datePurchased);
        String resolvedQuantity = quantity != null ? quantity : "0";
        String resolvedStartDate = defaultString(startDate);
        String resolvedEndDate = defaultString(endDate);
        String resolvedLocation = defaultString(location);
        return Map.of(
                "name", resolvedFirstName,
                "eventName", resolvedEventName,
                "orderId", resolvedOrderId,
                "orderLink", buildOrderLink(resolvedOrderId),
                "datePurchased", resolvedDatePurchased,
                "quantity", resolvedQuantity,
                "price", centsToPurchaseEmailPrice(priceInCents),
                "startDate", resolvedStartDate,
                "endDate", resolvedEndDate,
                "location", resolvedLocation);
    }

    private static String buildOrderLink(String orderId) {
        String resolvedOrderId = Optional.ofNullable(orderId).orElse("");
        return UrlUtils.getUrlWithCurrentEnvironment("/order/" + resolvedOrderId)
                .orElse(UrlUtils.SPORTSHUB_URL + "/order/" + resolvedOrderId);
    }

    private static String defaultString(String value) {
        return value != null ? value : "";
    }

    private static String centsToPurchaseEmailPrice(Double priceInCents) {
        if (priceInCents == null) {
            return "0.0";
        }
        BigDecimal dollars = BigDecimal.valueOf(priceInCents)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                .stripTrailingZeros();
        String formatted = dollars.toPlainString();
        return formatted.contains(".") ? formatted : formatted + ".0";
    }

    static Optional<String> getOrganiserEmailForTicketEmail(Firestore db, String organiserId) throws ExecutionException, InterruptedException {
        DocumentSnapshot organiserSnapshot = fetchNestedDocument(
                db,
                CollectionPaths.USERS,
                CollectionPaths.ACTIVE,
                CollectionPaths.PRIVATE,
                organiserId);

        if (!organiserSnapshot.exists()) {
            logger.error("Organiser does not exist: organiserId={}", organiserId);
            return Optional.empty();
        }

        if (Boolean.TRUE.equals(organiserSnapshot.getBoolean("sendOrganiserTicketEmails"))) {
            Object contactInfo = organiserSnapshot.get("contactInformation");
            if (contactInfo instanceof Map<?, ?> contactInfoMap) {
                @SuppressWarnings("unchecked")
                Map<String, Object> typedContactInfo = (Map<String, Object>) contactInfoMap;
                return extractContactEmail(typedContactInfo);
            }

            logger.warn("Organiser contact information is missing or malformed. organiserId={}", organiserId);
        }

        return Optional.empty();
    }

    private static Optional<String> extractContactEmail(Map<String, Object> contactInfo) {
        if (contactInfo == null) {
            return Optional.empty();
        }

        Object email = contactInfo.get("email");
        if (email instanceof String emailString && !emailString.isBlank()) {
            return Optional.of(emailString);
        }

        return Optional.empty();
    }

    private static boolean sendPurchaseEmailCopyToOrganiser(
            Optional<String> organiserEmail,
            String organiserId,
            Map<String, String> variables,
            PurchaseEmailSender emailSender) {
        if (organiserEmail.isEmpty()) {
            return true;
        }

        boolean organiserEmailSent;
        try {
            organiserEmailSent = emailSender.send(EmailTemplateType.PURCHASE, organiserEmail.get(), variables);
        } catch (Exception e) {
            logger.warn("Failed to send copy of purchase email to organiser {} at {}",
                    organiserId, organiserEmail.get(), e);
            return false;
        }
        if (!organiserEmailSent) {
            logger.warn("Failed to send copy of purchase email to organiser {} at {}",
                    organiserId, organiserEmail.get());
            return false;
        }

        return true;
    }

    /**
     * Sends a "booking request received — awaiting organiser approval" email to the buyer.
     * Triggered on {@code checkout.session.completed} when the Stripe capture method is manual.
     *
     * <p>The email template ID is taken from {@link EmailTemplateType#BOOKING_APPROVAL_TENTATIVE}.
     * While the template ID is still the {@link #PLACEHOLDER_TEMPLATE_ID} placeholder the method
     * skips sending and logs a warning.
     *
     * @param eventId    The event ID
     * @param visibility Either "Private" or "Public"
     * @param email      The buyer's email address
     * @param firstName  The buyer's first name
     * @param orderId    The order ID
     * @return true if the email was sent successfully, false otherwise
     */
    public static boolean sendBookingApprovalTentativeEmail(String eventId, String visibility,
            String email, String firstName, String orderId) {
        String templateId = EmailTemplateType.BOOKING_APPROVAL_TENTATIVE.templateId;
        if (isPlaceholderTemplateId(templateId)) {
            logger.warn("BOOKING_APPROVAL_TENTATIVE template id is not yet configured (still placeholder). "
                    + "Skipping tentative booking email. orderId={}", orderId);
            return false;
        }
        return sendBookingApprovalEmailWithTemplate(templateId, eventId, visibility, email, firstName, orderId);
    }

    /**
     * Sends a "your booking has been approved — you're confirmed!" email to the buyer.
     * Triggered when an organiser approves a pending booking.
     *
     * <p>The email template ID is taken from {@link EmailTemplateType#BOOKING_APPROVED}.
     * While the template ID is still the {@link #PLACEHOLDER_TEMPLATE_ID} placeholder the method
     * skips sending and logs a warning.
     *
     * @param eventId    The event ID
     * @param visibility Either "Private" or "Public"
     * @param email      The buyer's email address
     * @param firstName  The buyer's first name
     * @param orderId    The order ID
     * @return true if the email was sent successfully, false otherwise
     */
    public static boolean sendBookingApprovedEmail(String eventId, String visibility,
            String email, String firstName, String orderId) {
        String templateId = EmailTemplateType.BOOKING_APPROVED.templateId;
        if (isPlaceholderTemplateId(templateId)) {
            logger.warn("BOOKING_APPROVED template id is not yet configured (still placeholder). "
                    + "Skipping booking approved email. orderId={}", orderId);
            return false;
        }
        return sendBookingApprovalEmailWithTemplate(templateId, eventId, visibility, email, firstName, orderId);
    }

    /**
     * Shared implementation for booking-approval flow emails.
     * Fetches event and order data from Firestore, builds variables, and sends via Loops.
     */
    private static boolean sendBookingApprovalEmailWithTemplate(String templateId, String eventId,
            String visibility, String email, String firstName, String orderId) {
        try {
            Firestore db = FirebaseService.getFirestore();

            DocumentSnapshot eventSnapshot = fetchNestedDocument(
                    db, CollectionPaths.EVENTS, CollectionPaths.ACTIVE, visibility, eventId);
            if (!eventSnapshot.exists()) {
                logger.error("Unable to find event in datastore to send booking approval email. eventId={}", eventId);
                return false;
            }

            DocumentSnapshot orderSnapshot = fetchRootDocument(db, CollectionPaths.ORDERS, orderId);
            if (!orderSnapshot.exists()) {
                logger.error("Unable to find order in datastore to send booking approval email. orderId={}", orderId);
                return false;
            }

            Map<String, String> variables = buildEmailVariables(eventSnapshot, orderSnapshot, firstName, orderId);
            boolean sent = EmailClient.sendEmailWithLoopsWithRetries(templateId, email, variables);
            if (!sent) {
                logger.warn("Failed to send booking approval email (template={}) for order {} to {}",
                        templateId, orderId, email);
            }
            return sent;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            logger.warn("Booking approval email send interrupted for order {} to {}", orderId, email, e);
            return false;
        } catch (Exception e) {
            logger.error("Failed to send booking approval email (template={}) for order {} to {}: {}",
                    templateId, orderId, email, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Notifies the organiser that a new booking request is awaiting their approval.
     * Triggered on {@code checkout.session.completed} when the Stripe capture method is manual.
     *
     * <p>The template ID is taken from {@link EmailTemplateType#BOOKING_APPROVAL_ORGANISER}.
     * While it is still the {@link #PLACEHOLDER_TEMPLATE_ID} placeholder the method skips
     * sending and logs a warning so dev/CI environments are not affected.
     *
     * <p>If the organiser has not opted in to ticket-related emails
     * ({@code sendOrganiserTicketEmails == false}) the email is silently skipped (not an error).
     *
     * @param eventId      The event ID
     * @param visibility   Either "Private" or "Public"
     * @param attendeeName The buyer's full name
     * @param orderId      The order ID
     * @param quantity     Number of tickets in the order
     * @return true unless an unexpected error occurred
     */
    public static boolean sendOrganiserPendingBookingEmail(String eventId, String visibility,
            String attendeeName, String orderId, int quantity) {
        String templateId = EmailTemplateType.BOOKING_APPROVAL_ORGANISER.templateId;
        if (isPlaceholderTemplateId(templateId)) {
            logger.warn("BOOKING_APPROVAL_ORGANISER template id is not yet configured (still placeholder). "
                    + "Skipping organiser notification. orderId={}", orderId);
            return false;
        }

        try {
            Firestore db = FirebaseService.getFirestore();

            DocumentSnapshot eventSnapshot = fetchNestedDocument(
                    db, CollectionPaths.EVENTS, CollectionPaths.ACTIVE, visibility, eventId);
            if (!eventSnapshot.exists()) {
                logger.error("Unable to find event for organiser pending booking email. eventId={}", eventId);
                return false;
            }

            String organiserId = eventSnapshot.getString("organiserId");
            if (organiserId == null || organiserId.isBlank()) {
                logger.warn("Event {} has no organiserId. Skipping organiser notification. orderId={}", eventId, orderId);
                return true;
            }

            Optional<String> organiserEmail = getOrganiserEmailForTicketEmail(db, organiserId);
            if (organiserEmail.isEmpty()) {
                logger.info("No organiser notification email configured. organiserId={}, orderId={}",
                        organiserId, orderId);
                return true;
            }

            DocumentSnapshot organiserSnapshot = fetchNestedDocument(
                    db, CollectionPaths.USERS, CollectionPaths.ACTIVE, CollectionPaths.PRIVATE, organiserId);
            String organiserName = "";
            if (organiserSnapshot.exists()) {
                String firstName = organiserSnapshot.getString("firstName");
                if (firstName != null) {
                    organiserName = firstName;
                }
            }

            String eventName = defaultString(eventSnapshot.getString("name"));
            String pendingTabUrl = UrlUtils.getUrlWithCurrentEnvironment("/organiser/event/" + eventId)
                    .orElse(UrlUtils.SPORTSHUB_URL + "/organiser/event/" + eventId);

            Map<String, String> variables = Map.of(
                    "organiserName", organiserName,
                    "attendeeName", defaultString(attendeeName),
                    "eventName", eventName,
                    "quantity", String.valueOf(quantity),
                    "orderId", defaultString(orderId),
                    "pendingTabUrl", pendingTabUrl,
                    "autoExpiryHours", "48");

            boolean sent = EmailClient.sendEmailWithLoopsWithRetries(templateId, organiserEmail.get(), variables);
            if (!sent) {
                logger.warn("Failed to send organiser pending booking email. orderId={}, organiserId={}",
                        orderId, organiserId);
            }
            return sent;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            logger.warn("Organiser pending booking email send interrupted. orderId={}", orderId, e);
            return false;
        } catch (Exception e) {
            logger.error("Failed to send organiser pending booking email. orderId={}: {}",
                    orderId, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Sends a payment cancellation email after tickets/order are marked as REJECTED.
     *
     * @param email recipient email
     * @param fullName purchaser full name
     * @param eventName event name
     * @param orderId order ID
     * @param ticketCount number of canceled tickets
     * @return true if email was sent successfully, false otherwise
     */
    public static boolean sendCancellationEmail(String email, String fullName, String eventName,
                                                String orderId, int ticketCount) {
        if (LOOPS_PAYMENT_CANCELLED_EMAIL_TEMPLATE_ID == null
                || LOOPS_PAYMENT_CANCELLED_EMAIL_TEMPLATE_ID.isBlank()) {
            logger.warn("{} not configured. Skipping cancellation email.",
                    LOOPS_PAYMENT_CANCELLED_EMAIL_TEMPLATE_ID_ENV_VAR);
            return false;
        }

        Map<String, String> variables = Map.of(
                "name", Optional.ofNullable(fullName).orElse(""),
                "eventName", Optional.ofNullable(eventName).orElse("Event"),
                "orderId", Optional.ofNullable(orderId).orElse(""),
                "ticketCount", String.valueOf(ticketCount)
        );

        boolean sent;
        try {
            sent = EmailClient.sendEmailWithLoopsWithRetries(
                    LOOPS_PAYMENT_CANCELLED_EMAIL_TEMPLATE_ID, email, variables);
        } catch (Exception e) {
            logger.warn("Failed to send cancellation email for order {} to {}", orderId, email, e);
            return false;
        }

        if (sent) {
            logger.info("Successfully sent cancellation email for order {} to {}", orderId, email);
        } else {
            logger.warn("Failed to send cancellation email for order {} to {}", orderId, email);
        }
        return sent;
    }
}
