package com.functions.stripe.services;

import java.math.BigInteger;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.Attendee;
import com.functions.events.models.EventData;
import com.functions.events.models.EventMetadata;
import com.functions.events.models.Purchaser;
import com.functions.firebase.services.FirebaseService;
import com.functions.firebase.services.FirebaseService.CollectionPaths;
import com.functions.fulfilment.handlers.CompleteFulfilmentSessionHandler;
import com.functions.fulfilment.models.requests.CompleteFulfilmentSessionRequest;
import com.functions.stripe.models.Order;
import com.functions.stripe.models.Ticket;
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
 * Manages ticket purchases, refunds, and session expirations.
 */
public class WebhookService {
    private static final Logger logger = LoggerFactory.getLogger(WebhookService.class);
    
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
        
        ApiFuture<DocumentSnapshot> future = transaction.get(eventMetadataRef);
        DocumentSnapshot eventMetadataSnapshot = future.get();
        
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
            Session.TotalDetails totalDetails) throws Exception {
        
        Firestore db = FirebaseService.getFirestore();
        String privacyPath = isPrivate ? CollectionPaths.PRIVATE : CollectionPaths.PUBLIC;
        DocumentReference eventRef = db.collection(
            CollectionPaths.EVENTS + "/" + CollectionPaths.ACTIVE + "/" + privacyPath
        ).document(eventId);
        DocumentReference eventMetadataRef = db.collection(CollectionPaths.EVENTS_METADATA).document(eventId);
        
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
        } else {
            attendee.setPhone(phoneNumber);
            attendee.setTicketCount(attendee.getTicketCount() + quantity.intValue());
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
        
        List<String> ticketIds = new ArrayList<>();
        
        // Create tickets
        for (int i = 0; i < quantity; i++) {
            DocumentReference ticketRef = db.collection("Tickets").document();
            
            Ticket ticket = Ticket.builder()
                .eventId(eventId)
                .orderId(orderRef.getId())
                .price(unitAmount)
                .purchaseDate(purchaseTime)
                .build();
            
            transaction.create(ticketRef, ticket);
            ticketIds.add(ticketRef.getId());
        }
        
        // Create order
        Order order = Order.builder()
            .datePurchased(purchaseTime)
            .email(customerEmail)
            .fullName(fullName)
            .phone(phoneNumber)
            .applicationFees(applicationFees)
            .discounts(discounts)
            .tickets(ticketIds)
            .build();
        
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
        
        // Hash the email for the Firestore key
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
        
        // Restock the tickets
        transaction.update(eventRef, "vacancy", FieldValue.increment(quantity));
        
        // Add current checkout session to the processed list
        transaction.update(eventMetadataRef, "completedStripeCheckoutSessionIds", 
                          FieldValue.arrayUnion(checkoutSessionId));
    }
    
    /**
     * Completes a fulfilment session by calling the Java cloud function.
     * 
     * @param fulfilmentSessionId The fulfilment session ID
     * @param fulfilmentEntityId The fulfilment entity ID
     */
    public static void completeFulfilmentSession(String fulfilmentSessionId, String fulfilmentEntityId) {
        logger.info("Completing fulfilment session with ID: {} and entity ID: {}", 
                   fulfilmentSessionId, fulfilmentEntityId);
        
        try {
            CompleteFulfilmentSessionRequest request = new CompleteFulfilmentSessionRequest(
                fulfilmentSessionId, fulfilmentEntityId
            );
            
            CompleteFulfilmentSessionHandler handler = new CompleteFulfilmentSessionHandler();
            String result = handler.handle(request);
            
            logger.info("Successfully completed fulfilment session with ID: {} and entity ID: {}. Result: {}", 
                       fulfilmentSessionId, fulfilmentEntityId, result);
        } catch (Exception e) {
            logger.error("Failed to complete fulfilment session with ID {} and entity ID {}: {}", 
                        fulfilmentSessionId, fulfilmentEntityId, e.getMessage(), e);
            throw new RuntimeException("Failed to complete fulfilment session", e);
        }
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
            String endFulfilmentEntityId) {
        
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
                    
                    // Fulfill the purchase
                    String orderIdResult = fulfillCompletedEventTicketPurchase(
                        transaction,
                        checkoutSessionId,
                        eventId,
                        isPrivate,
                        lineItems,
                        customerEmail,
                        fullName,
                        phoneNumber,
                        checkoutSession.getTotalDetails()
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
            if (completeFulfilmentSession && fulfilmentSessionId != null && endFulfilmentEntityId != null) {
                completeFulfilmentSession(fulfilmentSessionId, endFulfilmentEntityId);
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
            
            logger.info("Successfully handled checkout.session.expired webhook event. session={}", checkoutSessionId);
            return result;
            
        } catch (Exception e) {
            logger.error("Error processing expired session workflow: {}", e.getMessage(), e);
            return false;
        }
    }
}

