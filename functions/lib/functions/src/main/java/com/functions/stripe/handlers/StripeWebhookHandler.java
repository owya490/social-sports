package com.functions.stripe.handlers;

import java.io.BufferedReader;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.global.handlers.Global;
import com.functions.stripe.config.StripeConfig;
import com.functions.stripe.models.SessionMetadata;
import com.functions.stripe.services.WebhookService;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.LineItem;
import com.stripe.model.LineItemCollection;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;

/**
 * Handler for processing Stripe webhook events.
 * This is called from GlobalAppController when a Stripe webhook is detected.
 */
public class StripeWebhookHandler {
    private static final Logger logger = LoggerFactory.getLogger(StripeWebhookHandler.class);
    
    private static final List<String> IGNORED_EVENT_IDS = Arrays.asList("evt_1SAvvn05pkiJLNbsHt1mHThW");
    private static final String SPORTSHUB_URL_DOMAIN = "sportshub";
    private static final int MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB max payload size
    
    /**
     * Processes a Stripe webhook request with security checks.
     * 
     * Security features:
     * - Signature verification using Stripe's official SDK
     * - Payload size limits to prevent DOS attacks
     * - Webhook secret validation
     * - Input sanitization and validation
     * - Production URL filtering
     * - Idempotency checks via WebhookService
     * 
     * @param request The HTTP request
     * @param response The HTTP response
     */
    public static void handleWebhook(HttpRequest request, HttpResponse response) {
        String uuid = UUID.randomUUID().toString();
        logger.info("[Webhook-{}] Received webhook request", uuid);
        
        // Handle GET requests (health checks from GCP/Firebase)
        if ("GET".equalsIgnoreCase(request.getMethod())) {
            logger.warn("[Webhook-{}] Received GET request to webhook endpoint. Returning 200 without processing.", uuid);
            response.setStatusCode(200);
            return;
        }
        
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            logger.error("[Webhook-{}] Received non-POST request: {}", uuid, request.getMethod());
            response.setStatusCode(405);
            return;
        }
        
        
        // Security check: Ensure webhook secret is configured
        if (StripeConfig.STRIPE_WEBHOOK_ENDPOINT_SECRET == null || StripeConfig.STRIPE_WEBHOOK_ENDPOINT_SECRET.isEmpty()) {
            logger.error("[Webhook-{}] CRITICAL SECURITY ERROR: Webhook endpoint secret is not configured", uuid);
            response.setStatusCode(500);
            return;
        }
        
        // Get the request body with size limit to prevent DOS attacks
        String payload;
        try (BufferedReader reader = request.getReader()) {
            StringBuilder sb = new StringBuilder();
            char[] buffer = new char[1024];
            int bytesRead;
            int totalSize = 0;
            
            while ((bytesRead = reader.read(buffer)) != -1) {
                totalSize += bytesRead;
                if (totalSize > MAX_PAYLOAD_SIZE) {
                    logger.error("[Webhook-{}] Request payload exceeds maximum size limit of {} bytes", 
                                uuid, MAX_PAYLOAD_SIZE);
                    response.setStatusCode(413); // Payload Too Large
                    return;
                }
                sb.append(buffer, 0, bytesRead);
            }
            
            payload = sb.toString();
            
            if (payload.isEmpty()) {
                logger.error("[Webhook-{}] Request body is empty", uuid);
                response.setStatusCode(400);
                return;
            }
        } catch (Exception e) {
            logger.error("[Webhook-{}] Failed to read request body: {}", uuid, e.getMessage());
            response.setStatusCode(400);
            return;
        }
        
        String sigHeader = request.getFirstHeader("Stripe-Signature").orElse(null);
        if (sigHeader == null || sigHeader.isEmpty()) {
            logger.error("[Webhook-{}] Request headers did not contain valid Stripe-Signature", uuid);
            response.setStatusCode(401); // Unauthorized
            return;
        }
        
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, StripeConfig.STRIPE_WEBHOOK_ENDPOINT_SECRET);
        } catch (SignatureVerificationException e) {
            logger.error("[Webhook-{}] SECURITY: Invalid webhook signature - possible spoofing attempt", uuid);
            response.setStatusCode(401); // Unauthorized
            return;
        } catch (Exception e) {
            logger.error("[Webhook-{}] Failed to parse webhook payload: {}", uuid, e.getMessage());
            response.setStatusCode(400);
            return;
        }
        
        logger.info("[Webhook-{}] Verified webhook signature successfully: type={}, eventId={}", 
                   uuid, event.getType(), event.getId());
        
        // Validate event ID format (Stripe event IDs start with evt_)
        String eventId = event.getId();
        if (eventId == null || !eventId.startsWith("evt_")) {
            logger.error("[Webhook-{}] Invalid event ID format: {}", uuid, eventId);
            response.setStatusCode(400);
            return;
        }
        
        // Check if this is an ignored event
        if (IGNORED_EVENT_IDS.contains(eventId)) {
            logger.info("[Webhook-{}] Ignoring event {}", uuid, eventId);
            response.setStatusCode(200);
            return;
        }
        
        // Get the event data
        EventDataObjectDeserializer dataObjectDeserializer = event.getDataObjectDeserializer();
        StripeObject stripeObject;
        
        if (dataObjectDeserializer.getObject().isPresent()) {
            stripeObject = dataObjectDeserializer.getObject().get();
        } else {
            logger.error("[Webhook-{}] Unable to deserialize event data for event {}", uuid, event.getId());
            response.setStatusCode(500);
            return;
        }
        
        if (!(stripeObject instanceof Session)) {
            logger.error("[Webhook-{}] Event data is not a Session object for event {}", uuid, event.getId());
            response.setStatusCode(500);
            return;
        }
        
        Session session = (Session) stripeObject;
        
        // In production, only process events from SportsHub
        String projectName = Global.getEnv("PROJECT_NAME");
        logger.info("[Webhook-{}] Project name: {}", uuid, projectName);
        boolean isProd = "socialsportsprod".equals(projectName);
        
        if (isProd) {
            String successUrl = session.getSuccessUrl() != null ? session.getSuccessUrl().toLowerCase() : "";
            String cancelUrl = session.getCancelUrl() != null ? session.getCancelUrl().toLowerCase() : "";
            
            if (!successUrl.contains(SPORTSHUB_URL_DOMAIN) && !cancelUrl.contains(SPORTSHUB_URL_DOMAIN)) {
                logger.info("[Webhook-{}] Ignoring event as it is not a SPORTSHUB event. eventId={}, " +
                           "successUrl={}, cancelUrl={}", uuid, event.getId(), successUrl, cancelUrl);
                response.setStatusCode(200);
                return;
            }
        }
        
        // Route based on event type
        String eventType = event.getType();
        boolean success = false;
        
        switch (eventType) {
            case "checkout.session.completed":
                success = handleCheckoutSessionCompleted(uuid, event, session);
                break;
            case "checkout.session.expired":
                success = handleCheckoutSessionExpired(uuid, event, session);
                break;
            default:
                logger.error("[Webhook-{}] Stripe sent a webhook request which does not match any handled events. " +
                            "eventType={}, eventId={}", uuid, eventType, event.getId());
                response.setStatusCode(500);
                return;
        }
        
        if (success) {
            response.setStatusCode(200);
        } else {
            response.setStatusCode(500);
        }
    }
    
    /**
     * Handles checkout.session.completed webhook event.
     */
    private static boolean handleCheckoutSessionCompleted(String uuid, Event event, Session session) {
        logger.info("[Webhook-{}] Processing checkout.session.completed for event {}", uuid, event.getId());
        
        try {
            String checkoutSessionId = session.getId();
            String stripeAccount = event.getAccount();
            
            // Retrieve the full session with expanded line items
            Session fullSession = Session.retrieve(
                checkoutSessionId,
                com.stripe.param.checkout.SessionRetrieveParams.builder()
                    .addExpand("line_items")
                    .build(),
                com.stripe.net.RequestOptions.builder()
                    .setStripeAccount(stripeAccount)
                    .build()
            );
            
            if (fullSession == null) {
                logger.error("[Webhook-{}] Unable to retrieve stripe checkout session from webhook event", uuid);
                return false;
            }
            
            // Parse session metadata
            if (fullSession.getMetadata() == null) {
                logger.error("[Webhook-{}] Unable to retrieve session metadata, returned null. session={}", 
                            uuid, checkoutSessionId);
                return false;
            }
            
            SessionMetadata sessionMetadata;
            try {
                sessionMetadata = SessionMetadata.fromStripeMetadata(fullSession.getMetadata());
                logger.info("[Webhook-{}] Completed session_metadata for event id {} fulfilment session {}: {}",
                           uuid, sessionMetadata.getEventId(), sessionMetadata.getFulfilmentSessionId(), sessionMetadata);
            } catch (Exception e) {
                logger.error("[Webhook-{}] Session Metadata validation failed: {}", uuid, e.getMessage(), e);
                return false;
            }
            
            // Parse custom fields for full name and phone number
            if (fullSession.getCustomFields() == null || fullSession.getCustomFields().isEmpty()) {
                logger.error("[Webhook-{}] Unable to retrieve custom fields from session. session={}", 
                            uuid, checkoutSessionId);
                return false;
            }
            
            String fullName = null;
            String phoneNumber = null;
            
            for (Session.CustomField field : fullSession.getCustomFields()) {
                String key = field.getKey();
                if ("attendeeFullName".equals(key)) {
                    if (field.getText() != null && field.getText().getValue() != null) {
                        String rawName = field.getText().getValue();
                        // Sanitize and validate name input
                        fullName = sanitizeTextField(rawName, 200);
                        if (fullName == null || fullName.trim().isEmpty()) {
                            logger.error("[Webhook-{}] Invalid or empty attendeeFullName after sanitization", uuid);
                            return false;
                        }
                    } else {
                        logger.error("[Webhook-{}] attendeeFullName field text or value is null", uuid);
                        return false;
                    }
                } else if ("attendeePhone".equals(key)) {
                    if (field.getText() != null && field.getText().getValue() != null) {
                        String rawPhone = field.getText().getValue();
                        // Sanitize and validate phone input
                        phoneNumber = sanitizeTextField(rawPhone, 50);
                        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
                            logger.error("[Webhook-{}] Invalid or empty attendeePhone after sanitization", uuid);
                            return false;
                        }
                    } else {
                        logger.error("[Webhook-{}] attendeePhone field text or value is null", uuid);
                        return false;
                    }
                } else {
                    logger.warn("[Webhook-{}] Encountered unexpected custom field, ignoring: {}", uuid, key);
                    // Don't fail on unexpected fields, just log warning
                }
            }
            
            if (fullName == null || phoneNumber == null) {
                logger.error("[Webhook-{}] Required fields missing. fullName present: {}, phoneNumber present: {}", 
                            uuid, fullName != null, phoneNumber != null);
                return false;
            }
            
            // Get line items
            LineItemCollection lineItemCollection = fullSession.getLineItems();
            if (lineItemCollection == null || lineItemCollection.getData() == null) {
                logger.error("[Webhook-{}] Unable to obtain line_items from session. session={}", 
                            uuid, checkoutSessionId);
                return false;
            }
            
            List<LineItem> lineItems = lineItemCollection.getData();
            
            // Get customer details
            Session.CustomerDetails customerDetails = fullSession.getCustomerDetails();
            if (customerDetails == null || customerDetails.getEmail() == null) {
                logger.error("[Webhook-{}] Unable to obtain customer details from session. session={}", 
                            uuid, checkoutSessionId);
                return false;
            }
            
            String customerEmail = customerDetails.getEmail();
            
            // Validate and sanitize email address
            if (customerEmail == null || !isValidEmail(customerEmail)) {
                logger.error("[Webhook-{}] Invalid customer email address for session {}", uuid, checkoutSessionId);
                return false;
            }
            
            logger.info("[Webhook-{}] Attempting to fulfill completed event ticket purchase. session={}, eventId={}, " +
                       "customer={}", uuid, checkoutSessionId, sessionMetadata.getEventId(), customerEmail);
            
            // Execute the fulfillment workflow
            boolean success = WebhookService.fulfilmentWorkflowOnTicketPurchase(
                checkoutSessionId,
                sessionMetadata.getEventId(),
                sessionMetadata.getIsPrivate(),
                lineItems,
                customerEmail,
                fullSession,
                fullName,
                phoneNumber,
                sessionMetadata.getCompleteFulfilmentSession(),
                sessionMetadata.getFulfilmentSessionId(),
                sessionMetadata.getEndFulfilmentEntityId()
            );
            
            return success;
            
        } catch (Exception e) {
            logger.error("[Webhook-{}] Error handling checkout.session.completed: {}", uuid, e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Handles checkout.session.expired webhook event.
     */
    private static boolean handleCheckoutSessionExpired(String uuid, Event event, Session session) {
        logger.info("[Webhook-{}] Processing checkout.session.expired for event {}", uuid, event.getId());
        
        try {
            String checkoutSessionId = session.getId();
            if (checkoutSessionId == null || checkoutSessionId.isEmpty()) {
                logger.error("[Webhook-{}] Checkout session ID is null or empty", uuid);
                return false;
            }
            
            String stripeAccount = event.getAccount();
            if (stripeAccount == null || stripeAccount.isEmpty()) {
                logger.error("[Webhook-{}] Stripe account is null or empty for session {}", uuid, checkoutSessionId);
                return false;
            }
            
            // Retrieve the full session with expanded line items from Stripe API
            Session fullSession = Session.retrieve(
                checkoutSessionId,
                com.stripe.param.checkout.SessionRetrieveParams.builder()
                    .addExpand("line_items")
                    .build(),
                com.stripe.net.RequestOptions.builder()
                    .setStripeAccount(stripeAccount)
                    .build()
            );
            
            if (fullSession == null) {
                logger.error("[Webhook-{}] Unable to retrieve stripe checkout session from webhook event", uuid);
                return false;
            }
            
            // Parse session metadata
            if (fullSession.getMetadata() == null) {
                logger.error("[Webhook-{}] Unable to retrieve session metadata, returned null. session={}", 
                            uuid, checkoutSessionId);
                return false;
            }
            
            SessionMetadata sessionMetadata;
            try {
                sessionMetadata = SessionMetadata.fromStripeMetadata(fullSession.getMetadata());
                logger.info("[Webhook-{}] Expired session metadata for event id {} fulfilment session {}: {}",
                           uuid, sessionMetadata.getEventId(), sessionMetadata.getFulfilmentSessionId(), sessionMetadata);
            } catch (Exception e) {
                logger.error("[Webhook-{}] Session Metadata validation failed: {}", uuid, e.getMessage(), e);
                return false;
            }
            
            // Get line items
            LineItemCollection lineItemCollection = fullSession.getLineItems();
            if (lineItemCollection == null || lineItemCollection.getData() == null) {
                logger.error("[Webhook-{}] Unable to obtain line_items from session. session={}", 
                            uuid, checkoutSessionId);
                return false;
            }
            
            List<LineItem> lineItems = lineItemCollection.getData();
            
            logger.info("[Webhook-{}] Attempting to restock tickets for expired session. session={}, eventId={}", 
                       uuid, checkoutSessionId, sessionMetadata.getEventId());
            
            // Execute the expired session workflow
            boolean success = WebhookService.fulfilmentWorkflowOnExpiredSession(
                checkoutSessionId,
                sessionMetadata.getEventId(),
                sessionMetadata.getIsPrivate(),
                lineItems
            );
            
            return success;
            
        } catch (Exception e) {
            logger.error("[Webhook-{}] Error handling checkout.session.expired: {}", uuid, e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Sanitizes text field input to prevent injection attacks.
     * Removes control characters and limits length.
     * 
     * @param input The input string
     * @param maxLength Maximum allowed length
     * @return Sanitized string or null if invalid
     */
    private static String sanitizeTextField(String input, int maxLength) {
        if (input == null) {
            return null;
        }
        
        // Remove control characters and other potentially dangerous characters
        String sanitized = input.replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", "")
                               .replaceAll("[<>\"'`]", "")
                               .trim();
        
        // Enforce maximum length
        if (sanitized.length() > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }
        
        return sanitized;
    }
    
    /**
     * Validates email address format.
     * Uses a simple but effective regex pattern.
     * 
     * @param email The email address to validate
     * @return true if valid, false otherwise
     */
    private static boolean isValidEmail(String email) {
        if (email == null || email.isEmpty()) {
            return false;
        }
        
        // Basic email validation regex
        // Matches most valid email formats without being overly permissive
        String emailRegex = "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$";
        
        return email.matches(emailRegex) && email.length() <= 254; // RFC 5321 max length
    }
}

