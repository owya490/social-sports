package com.functions.stripe.handlers;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.global.handlers.Global;
import com.functions.stripe.config.StripeConfig;
import com.functions.stripe.config.StripeCustomFieldKeys;
import com.functions.stripe.models.SessionMetadata;
import com.functions.stripe.services.WebhookService;
import com.functions.utils.JavaUtils;
import com.functions.utils.logging.RequestLogContext;
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
        RequestLogContext logContext = RequestLogContext.current().withField("component", "stripeWebhook");
        String requestId = logContext.field("requestId");
        logger.info("Received Stripe webhook request {}", logContext.format("event", "stripe_webhook_received"));
        
        // Handle GET requests (health checks from GCP/Firebase)
        if ("GET".equalsIgnoreCase(request.getMethod())) {
            logger.warn("Received GET request to webhook endpoint. Returning 200 without processing. {}",
                    logContext.format("event", "stripe_webhook_health_check", "statusCode", 200));
            response.setStatusCode(200);
            return;
        }
        
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            logger.error("Received non-POST webhook request {}",
                    logContext.format("event", "stripe_webhook_method_not_allowed", "statusCode", 405));
            response.setStatusCode(405);
            return;
        }
        
        
        if (StripeConfig.STRIPE_WEBHOOK_ENDPOINT_SECRET == null || StripeConfig.STRIPE_WEBHOOK_ENDPOINT_SECRET.isEmpty()) {
            logger.error("Webhook endpoint secret is not configured {}",
                    logContext.format("event", "stripe_webhook_config_error", "statusCode", 500));
            response.setStatusCode(500);
            return;
        }
        
        // Get the request body with size limit to prevent DOS attacks
        String payload;
        try (InputStream inputStream = request.getInputStream()) {
            payload = readPayload(inputStream, request.getContentLength());
            if (payload.isEmpty()) {
                logger.error("Request body is empty {}",
                        logContext.format("event", "stripe_webhook_empty_body", "statusCode", 400));
                response.setStatusCode(400);
                return;
            }
        } catch (PayloadTooLargeException e) {
            logger.error("Request payload exceeds maximum size limit {}",
                    logContext.format("event", "stripe_webhook_payload_too_large", "statusCode", 413,
                            "maxPayloadBytes", MAX_PAYLOAD_SIZE));
            response.setStatusCode(413);
            return;
        } catch (Exception e) {
            logger.error("Failed to read request body {}",
                    logContext.format("event", "stripe_webhook_body_read_failed", "statusCode", 400), e);
            response.setStatusCode(400);
            return;
        }
        
        String sigHeader = request.getFirstHeader("Stripe-Signature").orElse(null);
        if (sigHeader == null || sigHeader.isBlank()) {
            logger.error("Request headers did not contain valid Stripe-Signature {}",
                    logContext.format("event", "stripe_webhook_missing_signature", "statusCode", 401));
            response.setStatusCode(401); // Unauthorized
            return;
        }
        
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, StripeConfig.STRIPE_WEBHOOK_ENDPOINT_SECRET);
        } catch (SignatureVerificationException e) {
            logger.error("SECURITY: Invalid webhook signature - possible spoofing attempt {}",
                    logContext.format("event", "stripe_webhook_invalid_signature", "statusCode", 401));
            response.setStatusCode(401); // Unauthorized
            return;
        } catch (Exception e) {
            logger.error("Failed to parse webhook payload {}",
                    logContext.format("event", "stripe_webhook_parse_failed", "statusCode", 400), e);
            response.setStatusCode(400);
            return;
        }

        logContext.withField("stripeEventType", event.getType()).withField("stripeEventId", event.getId());
        
        logger.info("Verified webhook signature successfully {}",
                logContext.format("event", "stripe_webhook_verified"));
        
        // Validate event ID format (Stripe event IDs start with evt_)
        String eventId = event.getId();
        if (eventId == null || !eventId.startsWith("evt_")) {
            logger.error("Invalid event ID format {}",
                    logContext.format("event", "stripe_webhook_invalid_event_id", "statusCode", 400));
            response.setStatusCode(400);
            return;
        }
        
        // Check if this is an ignored event
        if (IGNORED_EVENT_IDS.contains(eventId)) {
            logger.info("Ignoring configured Stripe event {}", logContext.format("event", "stripe_webhook_ignored", "statusCode", 200));
            response.setStatusCode(200);
            return;
        }
        // Route based on event type
        String eventType = event.getType();
        boolean success = false;
        
        switch (eventType) {
            case "checkout.session.completed":
                success = handleCheckoutSessionCompleted(logContext, event);
                break;
            case "checkout.session.expired":
                success = handleCheckoutSessionExpired(logContext, event);
                break;
            case "payment_intent.canceled":
                success = handlePaymentIntentCanceled(logContext, event);
                break;
            default:
                logger.error("Stripe sent a webhook request which does not match any handled events {}",
                        logContext.format("event", "stripe_webhook_unhandled_event_type", "statusCode", 200));
                // We intentionally acknowledge unhandled event types so Stripe does not keep retrying
                // events that this endpoint is not meant to process.
                response.setStatusCode(200);
                return;
        }
        
        if (success) {
            logger.info("Stripe webhook processed successfully {}",
                    logContext.format("event", "stripe_webhook_processed", "statusCode", 200, "requestId", requestId));
            response.setStatusCode(200);
        } else {
            logger.error("Stripe webhook processing failed {}",
                    logContext.format("event", "stripe_webhook_failed", "statusCode", 500));
            response.setStatusCode(500);
        }
    }
    
    /**
     * Handles checkout.session.completed webhook event.
     */
    private static boolean handleCheckoutSessionCompleted(RequestLogContext logContext, Event event) {
        logger.info("Processing checkout.session.completed {}", logContext.format("event", "stripe_checkout_completed_start"));
        
        try {
            String checkoutSessionId = extractObjectIdFromEvent(event, logContext);
            if (checkoutSessionId == null || checkoutSessionId.isBlank()) {
                logger.error("Unable to retrieve checkout session ID from event {}",
                        logContext.format("event", "stripe_checkout_session_id_missing"));
                return false;
            }
            logContext.withField("checkoutSessionId", checkoutSessionId);
            String stripeAccount = event.getAccount();

            if (stripeAccount == null || stripeAccount.isEmpty()) {
                logger.error("Stripe account is null or empty for session {}",
                        logContext.format("event", "stripe_account_missing"));
                return false;
            }
            logContext.withField("stripeAccountId", stripeAccount);
            
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
                logger.error("Unable to retrieve stripe checkout session from webhook event {}",
                        logContext.format("event", "stripe_checkout_session_retrieve_failed"));
                return false;
            }

            if (shouldIgnoreNonSportsHubCheckoutEvent(logContext, event, fullSession)) {
                return true;
            }
            
            // Parse session metadata
            if (fullSession.getMetadata() == null) {
                logger.error("Unable to retrieve session metadata, returned null {}",
                        logContext.format("event", "stripe_session_metadata_missing"));
                return false;
            }
            
            SessionMetadata sessionMetadata;
            try {
                sessionMetadata = SessionMetadata.fromStripeMetadata(fullSession.getMetadata());
                logContext.withField("eventId", sessionMetadata.getEventId())
                        .withField("fulfilmentSessionId", sessionMetadata.getFulfilmentSessionId());
                logger.info("Parsed completed session metadata {}",
                        logContext.format("event", "stripe_session_metadata_parsed", "sessionMetadata", sessionMetadata));
            } catch (Exception e) {
                logger.error("Session Metadata validation failed {}",
                        logContext.format("event", "stripe_session_metadata_invalid"), e);
                return false;
            }
            
            // Parse custom fields for full name and phone number
            if (fullSession.getCustomFields() == null || fullSession.getCustomFields().isEmpty()) {
                logger.error("Unable to retrieve custom fields from session {}",
                        logContext.format("event", "stripe_custom_fields_missing"));
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
                            logger.error("Invalid or empty attendeeFullName {}",
                                    logContext.format("event", "stripe_attendee_name_invalid"));
                            return false;
                        }
                    } else {
                        logger.error("attendeeFullName field text or value is null {}",
                                logContext.format("event", "stripe_attendee_name_missing"));
                        return false;
                    }
                } else if (StripeCustomFieldKeys.ATTENDEE_PHONE.equals(key)) {
                    if (field.getText() != null && field.getText().getValue() != null) {
                        phoneNumber = field.getText().getValue();
                        if (phoneNumber.trim().isEmpty()) {
                            logger.error("Invalid or empty attendeePhone {}",
                                    logContext.format("event", "stripe_attendee_phone_invalid"));
                            return false;
                        }
                    } else {
                        logger.error("attendeePhone field text or value is null {}",
                                logContext.format("event", "stripe_attendee_phone_missing"));
                        return false;
                    }
                } else {
                    logger.warn("Ignoring unexpected custom field {}",
                            logContext.format("event", "stripe_custom_field_ignored", "customFieldKey", key));
                }
            }
            
            if (fullName == null || phoneNumber == null) {
                logger.error("Required fields missing {}",
                        logContext.format("event", "stripe_required_fields_missing",
                                "fullNamePresent", fullName != null, "phoneNumberPresent", phoneNumber != null));
                return false;
            }
            
            // Get line items
            LineItemCollection lineItemCollection = fullSession.getLineItems();
            if (lineItemCollection == null || lineItemCollection.getData() == null) {
                logger.error("Unable to obtain line_items from session {}",
                        logContext.format("event", "stripe_line_items_missing"));
                return false;
            }
            
            List<LineItem> lineItems = lineItemCollection.getData();
            
            // Get customer details
            Session.CustomerDetails customerDetails = fullSession.getCustomerDetails();
            if (customerDetails == null || customerDetails.getEmail() == null) {
                logger.error("Unable to obtain customer details from session {}",
                        logContext.format("event", "stripe_customer_details_missing"));
                return false;
            }
            
            String customerEmail = normalizeCustomerEmail(customerDetails.getEmail());

            if (customerEmail == null) {
                logger.error("Invalid customer email address for session {}",
                        logContext.format("event", "stripe_customer_email_invalid"));
                return false;
            }
            
            String paymentIntentId;
            String captureMethod;
            if (isFreeCheckoutSession(fullSession.getAmountTotal())) {
                // Stripe no-cost checkout sessions can complete without a PaymentIntent:
                // https://docs.stripe.com/payments/checkout/no-cost-orders
                logger.info("Free checkout session detected. Skipping payment intent lookup. {}",
                        logContext.format("event", "stripe_free_checkout_detected", "amountTotal", fullSession.getAmountTotal()));
                paymentIntentId = null;
                captureMethod = null;
            } else {
                // Retrieve payment intent and capture method for paid checkouts.
                paymentIntentId = fullSession.getPaymentIntent();
                if (paymentIntentId == null || paymentIntentId.isBlank()) {
                    logger.error("Payment intent ID is null or empty for session {}",
                            logContext.format("event", "stripe_payment_intent_missing"));
                    return false;
                }
                logContext.withField("paymentIntentId", paymentIntentId);
                
                try {
                    PaymentIntent paymentIntent = PaymentIntent.retrieve(
                        paymentIntentId,
                        com.stripe.net.RequestOptions.builder()
                            .setStripeAccount(stripeAccount)
                            .build()
                    );
                    
                    if (paymentIntent == null || paymentIntent.getCaptureMethod() == null) {
                        logger.error("Unable to retrieve payment intent or capture method {}",
                                logContext.format("event", "stripe_payment_intent_retrieve_failed"));
                        return false;
                    }
                    
                    captureMethod = paymentIntent.getCaptureMethod();
                    logContext.withField("captureMethod", captureMethod);
                    logger.info("Retrieved payment intent capture method {}",
                            logContext.format("event", "stripe_payment_intent_retrieved"));
                    
                } catch (Exception e) {
                    logger.error("Failed to retrieve payment intent {}",
                            logContext.format("event", "stripe_payment_intent_retrieve_failed"), e);
                    return false;
                }
            }
            
            logger.info("Attempting to fulfill completed event ticket purchase {}",
                    logContext.format("event", "stripe_ticket_purchase_fulfilment_start",
                            "customer", customerEmail, "paymentIntentId", paymentIntentId, "captureMethod", captureMethod));
            
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
            logger.error("Error handling checkout.session.completed {}",
                    logContext.format("event", "stripe_checkout_completed_failed"), e);
            return false;
        }
    }
    
    /**
     * Handles checkout.session.expired webhook event.
     */
    private static boolean handleCheckoutSessionExpired(RequestLogContext logContext, Event event) {
        logger.info("Processing checkout.session.expired {}", logContext.format("event", "stripe_checkout_expired_start"));
        
        try {
            String checkoutSessionId = extractObjectIdFromEvent(event, logContext);
            if (checkoutSessionId == null || checkoutSessionId.isEmpty()) {
                logger.error("Checkout session ID is null or empty {}",
                        logContext.format("event", "stripe_checkout_session_id_missing"));
                return false;
            }
            logContext.withField("checkoutSessionId", checkoutSessionId);
            
            String stripeAccount = event.getAccount();
            if (stripeAccount == null || stripeAccount.isEmpty()) {
                logger.error("Stripe account is null or empty for session {}",
                        logContext.format("event", "stripe_account_missing"));
                return false;
            }
            logContext.withField("stripeAccountId", stripeAccount);
            
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
                logger.error("Unable to retrieve stripe checkout session from webhook event {}",
                        logContext.format("event", "stripe_checkout_session_retrieve_failed"));
                return false;
            }

            if (shouldIgnoreNonSportsHubCheckoutEvent(logContext, event, fullSession)) {
                return true;
            }
            
            // Parse session metadata
            if (fullSession.getMetadata() == null) {
                logger.error("Unable to retrieve session metadata, returned null {}",
                        logContext.format("event", "stripe_session_metadata_missing"));
                return false;
            }
            
            SessionMetadata sessionMetadata;
            try {
                sessionMetadata = SessionMetadata.fromStripeMetadata(fullSession.getMetadata());
                logContext.withField("eventId", sessionMetadata.getEventId())
                        .withField("fulfilmentSessionId", sessionMetadata.getFulfilmentSessionId());
                logger.info("Parsed expired session metadata {}",
                        logContext.format("event", "stripe_session_metadata_parsed", "sessionMetadata", sessionMetadata));
            } catch (Exception e) {
                logger.error("Session Metadata validation failed {}",
                        logContext.format("event", "stripe_session_metadata_invalid"), e);
                return false;
            }
            
            // Get line items
            LineItemCollection lineItemCollection = fullSession.getLineItems();
            if (lineItemCollection == null || lineItemCollection.getData() == null) {
                logger.error("Unable to obtain line_items from session {}",
                        logContext.format("event", "stripe_line_items_missing"));
                return false;
            }
            
            List<LineItem> lineItems = lineItemCollection.getData();
            
            logger.info("Attempting to restock tickets for expired session {}",
                    logContext.format("event", "stripe_expired_session_restock_start"));
            
            // Execute the expired session workflow
            boolean success = WebhookService.fulfilmentWorkflowOnExpiredSession(
                checkoutSessionId,
                sessionMetadata.getEventId(),
                sessionMetadata.getIsPrivate(),
                lineItems
            );
            
            return success;
            
        } catch (Exception e) {
            logger.error("Error handling checkout.session.expired {}",
                    logContext.format("event", "stripe_checkout_expired_failed"), e);
            return false;
        }
    }

    /**
     * Handles payment_intent.canceled webhook event.
     */
    private static boolean handlePaymentIntentCanceled(RequestLogContext logContext, Event event) {
        logger.info("Processing payment_intent.canceled {}", logContext.format("event", "stripe_payment_intent_canceled_start"));

        String paymentIntentId = extractObjectIdFromEvent(event, logContext);
        if (paymentIntentId == null || paymentIntentId.isBlank()) {
            logger.error("Unable to retrieve payment intent ID from event {}",
                    logContext.format("event", "stripe_payment_intent_missing"));
            return false;
        }
        logContext.withField("paymentIntentId", paymentIntentId);

        boolean success = WebhookService.fulfilmentWorkflowOnPaymentIntentCanceled(paymentIntentId);
        if (!success) {
            logger.error("Failed to process payment_intent.canceled {}",
                    logContext.format("event", "stripe_payment_intent_canceled_failed"));
        }
        return success;
    }

    /**
     * Extracts the Stripe object id from an event payload.
     */
    private static String extractObjectIdFromEvent(Event event, RequestLogContext logContext) {
        try {
            String rawJson = event.getDataObjectDeserializer().getRawJson();
            if (rawJson != null && !rawJson.isBlank()) {
                String id = JavaUtils.objectMapper.readTree(rawJson).path("id").asText(null);
                if (id != null && !id.isBlank()) {
                    return id;
                }
            }
        } catch (Exception e) {
            logger.error("Failed extracting event object ID {}",
                    logContext.format("event", "stripe_event_object_id_extract_failed"), e);
        }
        return null;
    }

    private static boolean shouldIgnoreNonSportsHubCheckoutEvent(RequestLogContext logContext, Event event, Session session) {
        String projectName = Global.getEnv("PROJECT_NAME");
        logger.info("Resolved project name {}", logContext.format("event", "stripe_project_resolved", "projectName", projectName));
        boolean isProd = "socialsportsprod".equals(projectName);
        if (!isProd) {
            // Dev should accept all Stripe test events so local/dev verification remains straightforward.
            return false;
        }

        String successUrl = session.getSuccessUrl() != null ? session.getSuccessUrl().toLowerCase() : "";
        String cancelUrl = session.getCancelUrl() != null ? session.getCancelUrl().toLowerCase() : "";
        if (!successUrl.contains(SPORTSHUB_URL_DOMAIN) && !cancelUrl.contains(SPORTSHUB_URL_DOMAIN)) {
            logger.info("Ignoring non-SPORTSHUB checkout event {}",
                    logContext.format("event", "stripe_non_sportshub_checkout_ignored",
                            "successUrl", successUrl, "cancelUrl", cancelUrl));
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
