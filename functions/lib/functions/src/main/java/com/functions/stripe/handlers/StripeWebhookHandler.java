package com.functions.stripe.handlers;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.global.handlers.Global;
import com.functions.stripe.config.StripeConfig;
import com.functions.stripe.config.StripeCustomFieldKeys;
import com.functions.stripe.models.SessionMetadata;
import com.functions.stripe.services.WebhookService;
import com.functions.utils.JavaUtils;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.LineItem;
import com.stripe.model.LineItemCollection;
import com.stripe.model.PaymentIntent;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;

/**
 * Handler for processing Stripe webhook events.
 * This is shared by the dedicated Stripe webhook endpoint and the legacy
 * GlobalAppController webhook route.
 */
public class StripeWebhookHandler {
    private static final Logger logger = LoggerFactory.getLogger(StripeWebhookHandler.class);
    
    private static final Set<String> IGNORED_EVENT_IDS = Set.of("evt_1SAvvn05pkiJLNbsHt1mHThW");
    private static final String SPORTSHUB_URL_DOMAIN = "sportshub";
    static final int MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB max payload size
    
    /**
     * Processes a Stripe webhook request.
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
        
        
        if (StripeConfig.STRIPE_WEBHOOK_ENDPOINT_SECRET == null || StripeConfig.STRIPE_WEBHOOK_ENDPOINT_SECRET.isEmpty()) {
            logger.error("[Webhook-{}] Webhook endpoint secret is not configured", uuid);
            response.setStatusCode(500);
            return;
        }
        
        // Get the request body with size limit to prevent DOS attacks
        String payload;
        try (InputStream inputStream = request.getInputStream()) {
            payload = readPayload(inputStream, request.getContentLength());
            if (payload.isEmpty()) {
                logger.error("[Webhook-{}] Request body is empty", uuid);
                response.setStatusCode(400);
                return;
            }
        } catch (PayloadTooLargeException e) {
            logger.error("[Webhook-{}] Request payload exceeds maximum size limit of {} bytes",
                    uuid, MAX_PAYLOAD_SIZE);
            response.setStatusCode(413);
            return;
        } catch (Exception e) {
            logger.error("[Webhook-{}] Failed to read request body: {}", uuid, e.getMessage());
            response.setStatusCode(400);
            return;
        }
        
        String sigHeader = request.getFirstHeader("Stripe-Signature").orElse(null);
        if (sigHeader == null || sigHeader.isBlank()) {
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
        // Route based on event type
        String eventType = event.getType();
        boolean success = false;
        
        switch (eventType) {
            case "checkout.session.completed":
                success = handleCheckoutSessionCompleted(uuid, event);
                break;
            case "checkout.session.expired":
                success = handleCheckoutSessionExpired(uuid, event);
                break;
            case "payment_intent.canceled":
                success = handlePaymentIntentCanceled(uuid, event);
                break;
            default:
                logger.error("[Webhook-{}] Stripe sent a webhook request which does not match any handled events. " +
                            "eventType={}, eventId={}", uuid, eventType, event.getId());
                // We intentionally acknowledge unhandled event types so Stripe does not keep retrying
                // events that this endpoint is not meant to process.
                response.setStatusCode(200);
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
    private static boolean handleCheckoutSessionCompleted(String uuid, Event event) {
        logger.info("[Webhook-{}] Processing checkout.session.completed for event {}", uuid, event.getId());
        
        try {
            String checkoutSessionId = extractObjectIdFromEvent(event, uuid);
            if (checkoutSessionId == null || checkoutSessionId.isBlank()) {
                logger.error("[Webhook-{}] Unable to retrieve checkout session ID from event {}", uuid, event.getId());
                return false;
            }
            String stripeAccount = event.getAccount();

            if (stripeAccount == null || stripeAccount.isEmpty()) {
                logger.error("[Webhook-{}] Stripe account is null or empty for session {}", uuid, checkoutSessionId);
                return false;
            }
            
            // Stripe omits line items by default, so we explicitly expand them here.
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

            if (shouldIgnoreNonSportsHubCheckoutEvent(uuid, event, fullSession)) {
                return true;
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
                if (StripeCustomFieldKeys.ATTENDEE_FULL_NAME.equals(key)) {
                    if (field.getText() != null && field.getText().getValue() != null) {
                        fullName = field.getText().getValue();
                        if (fullName.trim().isEmpty()) {
                            logger.error("[Webhook-{}] Invalid or empty attendeeFullName", uuid);
                            return false;
                        }
                    } else {
                        logger.error("[Webhook-{}] attendeeFullName field text or value is null", uuid);
                        return false;
                    }
                } else if (StripeCustomFieldKeys.ATTENDEE_PHONE.equals(key)) {
                    if (field.getText() != null && field.getText().getValue() != null) {
                        phoneNumber = field.getText().getValue();
                        if (phoneNumber.trim().isEmpty()) {
                            logger.error("[Webhook-{}] Invalid or empty attendeePhone", uuid);
                            return false;
                        }
                    } else {
                        logger.error("[Webhook-{}] attendeePhone field text or value is null", uuid);
                        return false;
                    }
                } else {
                    logger.warn("[Webhook-{}] Ignoring unexpected custom field: {}", uuid, key);
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
            
            String customerEmail = normalizeCustomerEmail(customerDetails.getEmail());

            if (customerEmail == null) {
                logger.error("[Webhook-{}] Invalid customer email address for session {}", uuid, checkoutSessionId);
                return false;
            }
            
            String paymentIntentId;
            String captureMethod;
            if (isFreeCheckoutSession(fullSession.getAmountTotal())) {
                // Stripe no-cost checkout sessions can complete without a PaymentIntent:
                // https://docs.stripe.com/payments/checkout/no-cost-orders
                logger.info("[Webhook-{}] Free checkout session detected for session {}. amountTotal={}. Skipping payment intent lookup.",
                        uuid, checkoutSessionId, fullSession.getAmountTotal());
                paymentIntentId = null;
                captureMethod = null;
            } else {
                // Retrieve payment intent and capture method for paid checkouts.
                paymentIntentId = fullSession.getPaymentIntent();
                if (paymentIntentId == null || paymentIntentId.isBlank()) {
                    logger.error("[Webhook-{}] Payment intent ID is null or empty for session {}", uuid, checkoutSessionId);
                    return false;
                }
                
                try {
                    PaymentIntent paymentIntent = PaymentIntent.retrieve(
                        paymentIntentId,
                        com.stripe.net.RequestOptions.builder()
                            .setStripeAccount(stripeAccount)
                            .build()
                    );
                    
                    if (paymentIntent == null || paymentIntent.getCaptureMethod() == null) {
                        logger.error("[Webhook-{}] Unable to retrieve payment intent or capture method. paymentIntentId={}", 
                                    uuid, paymentIntentId);
                        return false;
                    }
                    
                    captureMethod = paymentIntent.getCaptureMethod();
                    logger.info("[Webhook-{}] Retrieved capture method: {} for payment intent: {}", 
                               uuid, captureMethod, paymentIntentId);
                    
                } catch (Exception e) {
                    logger.error("[Webhook-{}] Failed to retrieve payment intent: {}", uuid, e.getMessage(), e);
                    return false;
                }
            }
            
            logger.info("[Webhook-{}] Attempting to fulfill completed event ticket purchase. session={}, eventId={}, " +
                       "customer={}, paymentIntentId={}, captureMethod={}", 
                       uuid, checkoutSessionId, sessionMetadata.getEventId(),
                       customerEmail, paymentIntentId, captureMethod);
            
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
                sessionMetadata.getFulfilmentSessionId(),
                sessionMetadata.getEndFulfilmentEntityId(),
                paymentIntentId,
                captureMethod
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
    private static boolean handleCheckoutSessionExpired(String uuid, Event event) {
        logger.info("[Webhook-{}] Processing checkout.session.expired for event {}", uuid, event.getId());
        
        try {
            String checkoutSessionId = extractObjectIdFromEvent(event, uuid);
            if (checkoutSessionId == null || checkoutSessionId.isEmpty()) {
                logger.error("[Webhook-{}] Checkout session ID is null or empty", uuid);
                return false;
            }
            
            String stripeAccount = event.getAccount();
            if (stripeAccount == null || stripeAccount.isEmpty()) {
                logger.error("[Webhook-{}] Stripe account is null or empty for session {}", uuid, checkoutSessionId);
                return false;
            }
            
            // Stripe omits line items by default, so we explicitly expand them here.
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

            if (shouldIgnoreNonSportsHubCheckoutEvent(uuid, event, fullSession)) {
                return true;
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
     * Handles payment_intent.canceled webhook event.
     */
    private static boolean handlePaymentIntentCanceled(String uuid, Event event) {
        logger.info("[Webhook-{}] Processing payment_intent.canceled for event {}", uuid, event.getId());

        String paymentIntentId = extractObjectIdFromEvent(event, uuid);
        if (paymentIntentId == null || paymentIntentId.isBlank()) {
            logger.error("[Webhook-{}] Unable to retrieve payment intent ID from event {}", uuid, event.getId());
            return false;
        }

        boolean success = WebhookService.fulfilmentWorkflowOnPaymentIntentCanceled(paymentIntentId);
        if (!success) {
            logger.error("[Webhook-{}] Failed to process payment_intent.canceled for paymentIntentId={}",
                    uuid, paymentIntentId);
        }
        return success;
    }

    /**
     * Extracts the Stripe object id from an event payload.
     */
    private static String extractObjectIdFromEvent(Event event, String uuid) {
        try {
            String rawJson = event.getDataObjectDeserializer().getRawJson();
            if (rawJson != null && !rawJson.isBlank()) {
                String id = JavaUtils.objectMapper.readTree(rawJson).path("id").asText(null);
                if (id != null && !id.isBlank()) {
                    return id;
                }
            }
        } catch (Exception e) {
            logger.error("[Webhook-{}] Failed extracting event object ID for event {}: {}",
                    uuid, event.getId(), e.getMessage());
        }
        return null;
    }

    private static boolean shouldIgnoreNonSportsHubCheckoutEvent(String uuid, Event event, Session session) {
        String projectName = Global.getEnv("PROJECT_NAME");
        logger.info("[Webhook-{}] Project name: {}", uuid, projectName);
        boolean isProd = "socialsportsprod".equals(projectName);
        if (!isProd) {
            // Dev should accept all Stripe test events so local/dev verification remains straightforward.
            return false;
        }

        String successUrl = session.getSuccessUrl() != null ? session.getSuccessUrl().toLowerCase() : "";
        String cancelUrl = session.getCancelUrl() != null ? session.getCancelUrl().toLowerCase() : "";
        if (!successUrl.contains(SPORTSHUB_URL_DOMAIN) && !cancelUrl.contains(SPORTSHUB_URL_DOMAIN)) {
            logger.info("[Webhook-{}] Ignoring non-SPORTSHUB checkout event. eventId={}, successUrl={}, cancelUrl={}",
                    uuid, event.getId(), successUrl, cancelUrl);
            return true;
        }
        return false;
    }

    static boolean isFreeCheckoutSession(Long amountTotal) {
        return amountTotal != null && amountTotal == 0L;
    }

    static String readPayload(InputStream inputStream, long contentLength)
            throws IOException, PayloadTooLargeException {
        if (contentLength > MAX_PAYLOAD_SIZE) {
            throw new PayloadTooLargeException();
        }

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        byte[] buffer = new byte[4096];
        int totalBytesRead = 0;
        int currentBytesRead;

        while ((currentBytesRead = inputStream.read(buffer)) != -1) {
            totalBytesRead += currentBytesRead;
            if (totalBytesRead > MAX_PAYLOAD_SIZE) {
                throw new PayloadTooLargeException();
            }
            outputStream.write(buffer, 0, currentBytesRead);
        }

        return outputStream.toString(StandardCharsets.UTF_8);
    }

    private static String normalizeCustomerEmail(String email) {
        if (email == null) {
            return null;
        }

        String normalizedEmail = email.trim();
        if (normalizedEmail.isEmpty()) {
            return null;
        }

        return normalizedEmail;
    }

    static final class PayloadTooLargeException extends IOException {
        private static final long serialVersionUID = 1L;
    }
}
