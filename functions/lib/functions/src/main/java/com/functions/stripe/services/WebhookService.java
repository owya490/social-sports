package com.functions.stripe.services;

import java.math.BigInteger;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.emails.EmailService;
import com.functions.events.models.Attendee;
import com.functions.events.models.EventData;
import com.functions.events.models.EventMetadata;
import com.functions.events.models.Purchaser;
import com.functions.firebase.services.FirebaseService;
import com.functions.firebase.services.FirebaseService.CollectionPaths;
import com.functions.fulfilment.services.FulfilmentService;
import com.functions.tickets.models.Order;
import com.functions.tickets.models.OrderAndTicketStatus;
import com.functions.tickets.models.Ticket;
import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;
import com.stripe.model.LineItem;
import com.stripe.model.checkout.Session;

/**
 * Service class for handling Stripe webhook processing.
 * Manages ticket purchases and stripe session completions.
 */
public class WebhookService {
    private static final Logger logger = LoggerFactory.getLogger(WebhookService.class);
    
    /**
     * Retrieves form response IDs from a fulfilment session on a best-effort basis.
     * Returns an empty list if the session is not found or has no form entities.
     * 
     * @param transaction The Firestore transaction
     * @param fulfilmentSessionId The fulfilment session ID
     * @return List of form response IDs
     */
    private static List<String> getFormResponseIdsFromFulfilmentSession(
            Transaction transaction, String fulfilmentSessionId) {
        
        if (fulfilmentSessionId == null || fulfilmentSessionId.isEmpty()) {
            return new ArrayList<>();
        }
        
        try {
            Firestore db = FirebaseService.getFirestore();
            DocumentReference fulfilmentSessionRef = db.collection("FulfilmentSessions")
                .document(fulfilmentSessionId);
            
            DocumentSnapshot fulfilmentSessionSnapshot = transaction.get(fulfilmentSessionRef).get();
            
            if (!fulfilmentSessionSnapshot.exists()) {
                logger.error("Fulfilment session not found: {}. Skipping form response IDs.", fulfilmentSessionId);
                return new ArrayList<>();
            }
            
            @SuppressWarnings("unchecked")
            Map<String, Object> fulfilmentEntityMap = 
                (Map<String, Object>) fulfilmentSessionSnapshot.get("fulfilmentEntityMap");
            
            if (fulfilmentEntityMap == null || fulfilmentEntityMap.isEmpty()) {
                logger.info("No fulfilment entity map found in fulfilment session {}", fulfilmentSessionId);
                return new ArrayList<>();
            }
            
            List<String> formResponseIds = new ArrayList<>();
            
            for (Map.Entry<String, Object> entry : fulfilmentEntityMap.entrySet()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> entityData = (Map<String, Object>) entry.getValue();
                
                if (entityData != null && "FORMS".equals(entityData.get("type"))) {
                    String formResponseId = (String) entityData.get("formResponseId");
                    if (formResponseId != null && !formResponseId.isEmpty()) {
                        formResponseIds.add(formResponseId);
                    }
                }
            }
            
            if (!formResponseIds.isEmpty()) {
                logger.info("Retrieved {} form response IDs from fulfilment session {}: {}", 
                           formResponseIds.size(), fulfilmentSessionId, formResponseIds);
            } else {
                logger.info("No form response IDs found in fulfilment session {}", fulfilmentSessionId);
            }
            
            return formResponseIds;
            
        } catch (Exception e) {
            logger.warn("Failed to retrieve form response IDs from fulfilment session {}: {}. " +
                       "Continuing without form responses.", fulfilmentSessionId, e.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * Checks if a checkout session has already been processed.
     * 
     * @param transaction The Firestore transaction
     * @param checkoutSessionId The checkout session ID to check
     * @param eventId The event ID
     * @return true if already processed, false otherwise
     */
    public static boolean checkIfSessionHasBeenProcessedAlready(
            Transaction transaction, String checkoutSessionId, String eventId) throws Exception {
        
        Firestore db = FirebaseService.getFirestore();
        DocumentReference eventMetadataRef = db.collection(CollectionPaths.EVENTS_METADATA).document(eventId);
        
        DocumentSnapshot eventMetadataSnapshot = transaction.get(eventMetadataRef).get();
        
        if (!eventMetadataSnapshot.exists()) {
            logger.error("Unable to find event provided in datastore to fulfill purchase. eventId={}", eventId);
            return false;
        }
        
        EventMetadata eventMetadata = eventMetadataSnapshot.toObject(EventMetadata.class);
        if (eventMetadata == null) {
            return false;
        }
        
        List<String> completedSessions = eventMetadata.getCompletedStripeCheckoutSessionIds();
        if (completedSessions == null) {
            return false;
        }
        
        return completedSessions.contains(checkoutSessionId);
    }
    
    /**
     * Hashes an email address for use as a Firestore key.
     * Firestore doesn't like @ or . characters in keys.
     * 
     * @param email The email to hash
     * @return The hashed email as a string
     */
    private static String hashEmail(String email) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] messageDigest = md.digest(email.getBytes());
            BigInteger no = new BigInteger(1, messageDigest);
            return no.toString();
        } catch (Exception e) {
            logger.error("Failed to hash email: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to hash email", e);
        }
    }
    
    /**
     * Resolves the order and ticket status based on the capture method.
     * 
     * @param captureMethod The Stripe payment intent capture method
     * @return PENDING if manual capture, APPROVED otherwise
     */
    private static OrderAndTicketStatus resolveOrderAndTicketStatus(String captureMethod) {
        if ("manual".equalsIgnoreCase(captureMethod)) {
            return OrderAndTicketStatus.PENDING;
        }
        return OrderAndTicketStatus.APPROVED;
    }
    
    /**
     * Fulfills a completed event ticket purchase within a transaction.
     * Creates tickets, orders, and updates event metadata.
     * 
     * @param transaction The Firestore transaction
     * @param checkoutSessionId The checkout session ID
     * @param eventId The event ID
     * @param isPrivate Whether the event is private
     * @param lineItems The Stripe line items from the checkout
     * @param customerEmail The customer's email
     * @param fullName The customer's full name
     * @param phoneNumber The customer's phone number
     * @param totalDetails The payment details from Stripe
     * @param fulfilmentSessionId The fulfilment session ID (can be null)
     * @param paymentIntentId The Stripe payment intent ID
     * @param captureMethod The Stripe payment intent capture method
     * @return The order ID if successful, null otherwise
     */
    public static String fulfillCompletedEventTicketPurchase(
            Transaction transaction,
            String checkoutSessionId,
            String eventId,
            boolean isPrivate,
            List<LineItem> lineItems,
            String customerEmail,
            String fullName,
            String phoneNumber,
            Session.TotalDetails totalDetails,
            String fulfilmentSessionId,
            String paymentIntentId,
            String captureMethod) throws Exception {
        
        Firestore db = FirebaseService.getFirestore();
        String privacyPath = isPrivate ? CollectionPaths.PRIVATE : CollectionPaths.PUBLIC;
        DocumentReference eventRef = db.collection(
            CollectionPaths.EVENTS + "/" + CollectionPaths.ACTIVE + "/" + privacyPath
        ).document(eventId);
        DocumentReference eventMetadataRef = db.collection(CollectionPaths.EVENTS_METADATA).document(eventId);
        
        // Retrieve form response IDs from fulfilment session (best effort)
        List<String> formResponseIds = getFormResponseIdsFromFulfilmentSession(transaction, fulfilmentSessionId);
        
        // Read event data
        ApiFuture<DocumentSnapshot> eventFuture = transaction.get(eventRef);
        DocumentSnapshot eventSnapshot = eventFuture.get();
        
        if (!eventSnapshot.exists()) {
            logger.error("Unable to find event provided in datastore to fulfill purchase. eventId={}, isPrivate={}", 
                        eventId, isPrivate);
            return null;
        }
        
        EventData event = eventSnapshot.toObject(EventData.class);
        if (event == null) {
            logger.error("Event data is null for eventId={}", eventId);
            return null;
        }
        
        // Get the first line item (we only offer one item type per checkout)
        if (lineItems == null || lineItems.isEmpty()) {
            logger.error("Line items are empty for checkout session {}", checkoutSessionId);
            return null;
        }
        
        LineItem item = lineItems.get(0);
        Long quantity = item.getQuantity();
        if (quantity == null) {
            logger.error("Item quantity is null for checkout session {}", checkoutSessionId);
            return null;
        }
        
        Long unitAmount = item.getPrice() != null ? item.getPrice().getUnitAmount() : null;
        if (unitAmount == null) {
            logger.error("Item unit amount is null for checkout session {}", checkoutSessionId);
            return null;
        }
        
        // Hash the email for use as a Firestore key
        String emailHash = hashEmail(customerEmail);
        
        // Read event metadata
        ApiFuture<DocumentSnapshot> metadataFuture = transaction.get(eventMetadataRef);
        DocumentSnapshot maybeEventMetadata = metadataFuture.get();
        
        EventMetadata eventMetadata;
        boolean metadataExists = maybeEventMetadata.exists();
        
        if (metadataExists) {
            eventMetadata = maybeEventMetadata.toObject(EventMetadata.class);
            if (eventMetadata == null) {
                eventMetadata = new EventMetadata();
                eventMetadata.setOrganiserId(event.getOrganiserId());
                eventMetadata.setPurchaserMap(new HashMap<>());
                eventMetadata.setCompletedStripeCheckoutSessionIds(new ArrayList<>());
            }
        } else {
            eventMetadata = new EventMetadata();
            eventMetadata.setOrganiserId(event.getOrganiserId());
            eventMetadata.setPurchaserMap(new HashMap<>());
            eventMetadata.setCompletedStripeCheckoutSessionIds(new ArrayList<>());
        }
        
        logger.info("Event metadata: {}", eventMetadata);
        
        // Initialize purchaser map if null
        Map<String, Purchaser> purchaserMap = eventMetadata.getPurchaserMap();
        if (purchaserMap == null) {
            purchaserMap = new HashMap<>();
            eventMetadata.setPurchaserMap(purchaserMap);
        }
        
        // Initialize purchaser if doesn't exist
        Purchaser purchaser = purchaserMap.get(emailHash);
        if (purchaser == null) {
            purchaser = new Purchaser();
            purchaser.setEmail(customerEmail);
            purchaser.setAttendees(new HashMap<>());
            purchaser.setTotalTicketCount(0);
        }
        
        // Update purchaser information
        purchaser.setEmail(customerEmail);
        purchaser.setTotalTicketCount(purchaser.getTotalTicketCount() + quantity.intValue());
        
        // Update attendee information
        Map<String, Attendee> attendees = purchaser.getAttendees();
        if (attendees == null) {
            attendees = new HashMap<>();
            purchaser.setAttendees(attendees);
        }
        
        Attendee attendee = attendees.get(fullName);
        if (attendee == null) {
            attendee = new Attendee();
            attendee.setPhone(phoneNumber);
            attendee.setTicketCount(quantity.intValue());
            attendee.setFormResponseIds(formResponseIds != null ? new ArrayList<>(formResponseIds) : new ArrayList<>());
        } else {
            attendee.setPhone(phoneNumber);
            attendee.setTicketCount(attendee.getTicketCount() + quantity.intValue());
            
            // Merge form response IDs (avoid duplicates)
            List<String> existingFormResponses = attendee.getFormResponseIds();
            if (existingFormResponses == null) {
                existingFormResponses = new ArrayList<>();
            }
            if (formResponseIds != null && !formResponseIds.isEmpty()) {
                for (String formResponseId : formResponseIds) {
                    if (!existingFormResponses.contains(formResponseId)) {
                        existingFormResponses.add(formResponseId);
                    }
                }
            }
            attendee.setFormResponseIds(existingFormResponses);
        }
        attendees.put(fullName, attendee);
        purchaserMap.put(emailHash, purchaser);
        
        // Prepare update for event metadata
        Map<String, Object> updates = new HashMap<>();
        updates.put("purchaserMap." + emailHash, purchaser);
        updates.put("completeTicketCount", FieldValue.increment(quantity));
        
        if (metadataExists) {
            transaction.update(eventMetadataRef, updates);
        } else {
            transaction.set(eventMetadataRef, updates);
        }
        
        logger.info("Updated attendee list to reflect newly purchased tickets. email={}, name={}", 
                   customerEmail, fullName);
        
        // Create order and tickets
        Timestamp purchaseTime = Timestamp.now();
        DocumentReference orderRef = db.collection("Orders").document();
        
        long applicationFees = 0;
        long discounts = 0;
        if (totalDetails != null) {
            applicationFees = totalDetails.getAmountShipping() != null ? totalDetails.getAmountShipping() : 0;
            discounts = totalDetails.getAmountDiscount() != null ? totalDetails.getAmountDiscount() : 0;
        }
        
        // Resolve status based on capture method
        OrderAndTicketStatus status = resolveOrderAndTicketStatus(captureMethod);
        
        List<String> ticketIds = new ArrayList<>();
        
        // Create tickets
        for (int i = 0; i < quantity; i++) {
            DocumentReference ticketRef = db.collection("Tickets").document();
            
            // Associate form response ID with ticket if available
            String formResponseId = null;
            if (formResponseIds != null && i < formResponseIds.size()) {
                formResponseId = formResponseIds.get(i);
            }
            
            Ticket ticket = new Ticket();
            ticket.setEventId(eventId);
            ticket.setOrderId(orderRef.getId());
            ticket.setPrice(unitAmount);
            ticket.setPurchaseDate(purchaseTime);
            ticket.setStatus(status);
            ticket.setFormResponseId(formResponseId);
            
            transaction.create(ticketRef, ticket);
            ticketIds.add(ticketRef.getId());
        }
        
        // Create order
        Order order = new Order();
        order.setDatePurchased(purchaseTime);
        order.setEmail(customerEmail);
        order.setFullName(fullName);
        order.setPhone(phoneNumber);
        order.setApplicationFees(applicationFees);
        order.setDiscounts(discounts);
        order.setTickets(ticketIds);
        order.setStripePaymentIntentId(paymentIntentId);
        order.setStatus(status);
        
        transaction.set(orderRef, order);
        
        // Update event metadata with order ID
        transaction.update(eventMetadataRef, "orderIds", FieldValue.arrayUnion(orderRef.getId()));
        
        // Record the checkout session ID to ensure idempotency
        transaction.update(eventMetadataRef, "completedStripeCheckoutSessionIds", 
                          FieldValue.arrayUnion(checkoutSessionId));
        
        return orderRef.getId();
    }
    
    /**
     * Records a checkout session by customer email for tracking purposes.
     * 
     * @param transaction The Firestore transaction
     * @param eventId The event ID
     * @param checkoutSession The Stripe checkout session
     * @param customerEmail The customer's email
     */
    public static void recordCheckoutSessionByCustomerEmail(
            Transaction transaction,
            String eventId,
            Session checkoutSession,
            String customerEmail) throws Exception {
        
        Firestore db = FirebaseService.getFirestore();
        
        String emailHash = hashEmail(customerEmail);
        DocumentReference attendeeRef = db.collection("Attendees").document("emails")
            .collection(emailHash).document(eventId);
        
        Map<String, Object> data = new HashMap<>();
        data.put("checkout_sessions", FieldValue.arrayUnion(checkoutSession.getId()));
        
        transaction.set(attendeeRef, data, com.google.cloud.firestore.SetOptions.merge());
    }
    
    /**
     * Restocks tickets after a checkout session expires.
     * 
     * @param transaction The Firestore transaction
     * @param checkoutSessionId The checkout session ID
     * @param eventId The event ID
     * @param isPrivate Whether the event is private
     * @param lineItems The line items from the expired session
     */
    public static void restockTicketsAfterExpiredCheckout(
            Transaction transaction,
            String checkoutSessionId,
            String eventId,
            boolean isPrivate,
            List<LineItem> lineItems) throws Exception {
        
        Firestore db = FirebaseService.getFirestore();
        String privacyPath = isPrivate ? CollectionPaths.PRIVATE : CollectionPaths.PUBLIC;
        
        DocumentReference eventRef = db.collection(
            CollectionPaths.EVENTS + "/" + CollectionPaths.ACTIVE + "/" + privacyPath
        ).document(eventId);
        DocumentReference eventMetadataRef = db.collection(CollectionPaths.EVENTS_METADATA).document(eventId);
        
        if (lineItems == null || lineItems.isEmpty()) {
            logger.error("Line items are empty for expired checkout session {}", checkoutSessionId);
            return;
        }
        
        LineItem item = lineItems.get(0);
        Long quantity = item.getQuantity();
        
        if (quantity == null) {
            logger.error("Item quantity is null for expired checkout session {}", checkoutSessionId);
            return;
        }
        
        // Verify event exists before updating vacancy to avoid transaction commit failures
        ApiFuture<DocumentSnapshot> eventFuture = transaction.get(eventRef);
        DocumentSnapshot eventSnapshot = eventFuture.get();
        
        if (!eventSnapshot.exists()) {
            logger.error("Unable to find event to restock tickets for expired checkout. eventId={}, isPrivate={}", 
                        eventId, isPrivate);
            throw new IllegalStateException("Event does not exist: eventId=" + eventId);
        }
        
        // Restock the tickets
        transaction.update(eventRef, "vacancy", FieldValue.increment(quantity));
        
        // Add current checkout session to the processed list
        transaction.update(eventMetadataRef, "completedStripeCheckoutSessionIds", 
                          FieldValue.arrayUnion(checkoutSessionId));
    }
    
    /**
     * Orchestrates the entire workflow for processing a completed ticket purchase.
     * Runs within a Firestore transaction to ensure atomicity.
     * 
     * @param checkoutSessionId The checkout session ID
     * @param eventId The event ID
     * @param isPrivate Whether the event is private
     * @param lineItems The line items from the checkout
     * @param customerEmail The customer's email
     * @param checkoutSession The full checkout session
     * @param fullName The customer's full name
     * @param phoneNumber The customer's phone number
     * @param completeFulfilmentSession Whether to complete the fulfilment session
     * @param fulfilmentSessionId The fulfilment session ID
     * @param endFulfilmentEntityId The end fulfilment entity ID
     * @param paymentIntentId The Stripe payment intent ID
     * @param captureMethod The Stripe payment intent capture method
     * @return true if successful, false otherwise
     */
    public static boolean fulfilmentWorkflowOnTicketPurchase(
            String checkoutSessionId,
            String eventId,
            boolean isPrivate,
            List<LineItem> lineItems,
            String customerEmail,
            Session checkoutSession,
            String fullName,
            String phoneNumber,
            boolean completeFulfilmentSession,
            String fulfilmentSessionId,
            String endFulfilmentEntityId,
            String paymentIntentId,
            String captureMethod) {
        
        try {
            // Run the fulfillment logic in a transaction
            String orderId = FirebaseService.createFirestoreTransaction(transaction -> {
                try {
                    // Check if already processed
                    if (checkIfSessionHasBeenProcessedAlready(transaction, checkoutSessionId, eventId)) {
                        logger.info("Current webhook event checkout session has been already processed. " +
                                   "Returning early. session={}", checkoutSessionId);
                        return null;
                    }
                    
                    String orderIdResult = fulfillCompletedEventTicketPurchase(
                        transaction,
                        checkoutSessionId,
                        eventId,
                        isPrivate,
                        lineItems,
                        customerEmail,
                        fullName,
                        phoneNumber,
                        checkoutSession.getTotalDetails(),
                        fulfilmentSessionId,
                        paymentIntentId,
                        captureMethod
                    );
                    
                    if (orderIdResult == null) {
                        logger.error("Fulfillment of event ticket purchase was unsuccessful. session={}, eventId={}, " +
                                    "customer={}", checkoutSessionId, eventId, customerEmail);
                        throw new RuntimeException("Fulfillment failed");
                    }
                    
                    // Record checkout session by customer email
                    recordCheckoutSessionByCustomerEmail(transaction, eventId, checkoutSession, customerEmail);
                    
                    return orderIdResult;
                } catch (Exception e) {
                    logger.error("Error in fulfillment transaction: {}", e.getMessage(), e);
                    throw new RuntimeException("Transaction failed", e);
                }
            });
            
            if (orderId == null) {
                // Already processed
                return true;
            }
            
            // Complete fulfilment session if requested
            // TODO: now that fulfilment session is the default behaviour of checkout, clean up
            // should be enabled by default, and thus we don't need the completeFulfilmentSession
            // check anymore.
            if (completeFulfilmentSession && fulfilmentSessionId != null && endFulfilmentEntityId != null) {
                FulfilmentService.completeFulfilmentSession(fulfilmentSessionId, endFulfilmentEntityId);
            }
            
            // Send email to purchasing consumer
            String visibility = isPrivate ? "Private" : "Public";
            boolean emailSuccess = EmailService.sendPurchaseEmail(eventId, visibility, customerEmail, fullName, orderId);
            
            if (!emailSuccess) {
                logger.warn("Was unable to send email to {}. orderId={}", customerEmail, orderId);
            }
            
            logger.info("Successfully handled checkout.session.completed webhook event. session={}", checkoutSessionId);
            return true;
            
        } catch (Exception e) {
            logger.error("Error processing ticket purchase workflow: {}", e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Orchestrates the workflow for processing an expired checkout session.
     * Runs within a Firestore transaction to ensure atomicity.
     * 
     * @param checkoutSessionId The checkout session ID
     * @param eventId The event ID
     * @param isPrivate Whether the event is private
     * @param lineItems The line items from the expired session
     * @return true if successful, false otherwise
     */
    public static boolean fulfilmentWorkflowOnExpiredSession(
            String checkoutSessionId,
            String eventId,
            boolean isPrivate,
            List<LineItem> lineItems) {
        
        try {
            Boolean result = FirebaseService.createFirestoreTransaction(transaction -> {
                try {
                    // Check if already processed
                    if (checkIfSessionHasBeenProcessedAlready(transaction, checkoutSessionId, eventId)) {
                        logger.info("Current webhook event checkout session has been already processed. " +
                                   "Returning early. session={}", checkoutSessionId);
                        return true;
                    }
                    
                    // Restock tickets
                    restockTicketsAfterExpiredCheckout(transaction, checkoutSessionId, eventId, isPrivate, lineItems);
                    
                    return true;
                } catch (Exception e) {
                    logger.error("Error in expired session transaction: {}", e.getMessage(), e);
                    throw new RuntimeException("Transaction failed", e);
                }
            });
            
            if (result) {
            logger.info("Successfully handled checkout.session.expired webhook event. session={}", checkoutSessionId);
            } else {
                logger.error("Failed to handle checkout.session.expired webhook event. session={}", checkoutSessionId);
            }
            return result;
            
        } catch (Exception e) {
            logger.error("Error processing expired session workflow: {}", e.getMessage(), e);
            return false;
        }
    }
}

