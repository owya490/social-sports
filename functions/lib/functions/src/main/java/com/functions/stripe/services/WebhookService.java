package com.functions.stripe.services;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.emails.EmailService;
import com.functions.events.models.Attendee;
import com.functions.events.models.EventData;
import com.functions.events.models.EventMetadata;
import com.functions.events.models.Purchaser;
import com.functions.firebase.services.FirebaseService;
import com.functions.firebase.services.FirebaseService.CollectionPaths;
import com.functions.fulfilment.models.fulfilmentEntities.FormsFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;
import com.functions.fulfilment.services.FulfilmentService;
import com.functions.tickets.models.Order;
import com.functions.tickets.models.OrderAndTicketStatus;
import com.functions.tickets.models.Ticket;
import com.functions.tickets.repositories.OrdersRepository;
import com.functions.tickets.repositories.TicketsRepository;
import com.functions.utils.LogSanitizer;
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
    private static final int MAX_FULFILMENT_RETRIES = 3;
    private static final int MAX_PURCHASE_EMAIL_RETRIES = 3;
    private static final long FULFILMENT_RETRY_DELAY_MS = 2000;
    private static final long PURCHASE_EMAIL_INITIAL_RETRY_DELAY_MS = 1000;

    private enum PaymentIntentCancellationTransactionResult {
        PROCESSED,
        ALREADY_PROCESSED
    }

    @FunctionalInterface
    interface PurchaseEmailSender {
        boolean send(String eventId, String visibility, String customerEmail, String fullName, String orderId)
                throws Exception;
    }

    @FunctionalInterface
    private interface RetryableBooleanOperation {
        boolean run() throws Exception;
    }
    
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
            DocumentReference fulfilmentSessionRef = db.collection(CollectionPaths.FULFILMENT_SESSIONS_ROOT_PATH)
                .document(fulfilmentSessionId);
            
            DocumentSnapshot fulfilmentSessionSnapshot = transaction.get(fulfilmentSessionRef).get();
            
            if (!fulfilmentSessionSnapshot.exists()) {
                logger.error("Fulfilment session not found: {}. Skipping form response IDs.", fulfilmentSessionId);
                return new ArrayList<>();
            }
            
            FulfilmentSession fulfilmentSession = FulfilmentSession.fromFirestore(fulfilmentSessionSnapshot);
            if (fulfilmentSession.getFulfilmentEntityMap() == null
                    || fulfilmentSession.getFulfilmentEntityMap().isEmpty()) {
                logger.info("No fulfilment entity map found in fulfilment session {}", fulfilmentSessionId);
                return new ArrayList<>();
            }

            List<String> formResponseIds = extractFormResponseIds(fulfilmentSession);
            
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

    static List<String> extractFormResponseIds(FulfilmentSession fulfilmentSession) {

        List<String> formResponseIds = new ArrayList<>();
        if (fulfilmentSession == null
                || fulfilmentSession.getFulfilmentEntityMap() == null
                || fulfilmentSession.getFulfilmentEntityMap().isEmpty()) {
            return formResponseIds;
        }

        Map<String, FulfilmentEntity> fulfilmentEntityMap = fulfilmentSession.getFulfilmentEntityMap();
        List<String> fulfilmentEntityIds = fulfilmentSession.getFulfilmentEntityIds();
        if (fulfilmentEntityIds != null && !fulfilmentEntityIds.isEmpty()) {
            for (String fulfilmentEntityId : fulfilmentEntityIds) {
                appendFormResponseId(formResponseIds, fulfilmentEntityMap.get(fulfilmentEntityId));
            }
            return formResponseIds;
        }

        for (FulfilmentEntity fulfilmentEntity : fulfilmentEntityMap.values()) {
            appendFormResponseId(formResponseIds, fulfilmentEntity);
        }

        return formResponseIds;
    }

    private static void appendFormResponseId(List<String> formResponseIds, FulfilmentEntity fulfilmentEntity) {
        if (!(fulfilmentEntity instanceof FormsFulfilmentEntity formsFulfilmentEntity)) {
            return;
        }

        String formResponseId = formsFulfilmentEntity.getFormResponseId();
        if (formResponseId != null && !formResponseId.isEmpty()) {
            formResponseIds.add(formResponseId);
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
    private static boolean checkIfSessionHasBeenProcessedAlready(
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
        
        return getProcessedCheckoutSessionIds(eventMetadata).contains(checkoutSessionId);
    }

    /**
     * Checks if a payment intent cancellation webhook has already been processed.
     *
     * @param transaction The Firestore transaction
     * @param paymentIntentId The Stripe payment intent ID
     * @param eventId The event ID
     * @return true if already processed, false otherwise
     */
    private static boolean checkIfPaymentIntentHasBeenProcessedAlready(
            Transaction transaction, String paymentIntentId, String eventId) throws Exception {

        Firestore db = FirebaseService.getFirestore();
        DocumentReference eventMetadataRef = db.collection(CollectionPaths.EVENTS_METADATA).document(eventId);
        DocumentSnapshot eventMetadataSnapshot = transaction.get(eventMetadataRef).get();

        if (!eventMetadataSnapshot.exists()) {
            logger.error("Unable to find event metadata in datastore. eventId={}", eventId);
            return false;
        }

        EventMetadata eventMetadata = eventMetadataSnapshot.toObject(EventMetadata.class);
        if (eventMetadata == null) {
            return false;
        }

        List<String> completedPaymentIntents = eventMetadata.getCompletedStripePaymentIntentIds();
        if (completedPaymentIntents == null) {
            return false;
        }

        return completedPaymentIntents.contains(paymentIntentId);
    }

    private static List<String> getProcessedCheckoutSessionIds(EventMetadata eventMetadata) {
        List<String> processedSessionIds = new ArrayList<>();
        if (eventMetadata == null) {
            return processedSessionIds;
        }

        if (eventMetadata.getCompletedStripeCheckoutSession() != null) {
            processedSessionIds.addAll(eventMetadata.getCompletedStripeCheckoutSession());
        }
        if (eventMetadata.getCompletedStripeCheckoutSessionIds() != null) {
            processedSessionIds.addAll(eventMetadata.getCompletedStripeCheckoutSessionIds());
        }
        return processedSessionIds;
    }

    private static String hashEmail(String email) {
        if (email == null) {
            throw new IllegalArgumentException("Email cannot be null");
        }

        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hash = md.digest(email.getBytes(StandardCharsets.UTF_8));
            return new BigInteger(1, hash).toString();
        } catch (NoSuchAlgorithmException e) {
            logger.error("Failed to hash email: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to hash email", e);
        }
    }

    private static Map<String, Object> serializeCheckoutSessionForFirestore(Session checkoutSession) {
        if (checkoutSession == null) {
            return new HashMap<>();
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> serializedSession = com.functions.utils.JavaUtils.objectMapper.readValue(
                    checkoutSession.toJson(),
                    Map.class);
            return serializedSession != null ? serializedSession : new HashMap<>();
        } catch (Exception e) {
            logger.warn("Failed to serialize checkout session {} for Firestore compatibility: {}",
                    checkoutSession.getId(), e.getMessage());
            Map<String, Object> fallbackSession = new HashMap<>();
            fallbackSession.put("id", checkoutSession.getId());
            return fallbackSession;
        }
    }

    private static boolean retryBooleanOperation(
            String operationName,
            int maxRetries,
            long initialDelayMs,
            boolean exponentialBackoff,
            RetryableBooleanOperation operation) {

        for (int attempt = 0; attempt < maxRetries; attempt++) {
            try {
                if (operation.run()) {
                    return true;
                }

                logger.warn("{} returned unsuccessful on attempt {}/{}",
                        operationName, attempt + 1, maxRetries);
            } catch (Exception e) {
                logger.warn("{} failed on attempt {}/{}: {}",
                        operationName, attempt + 1, maxRetries, e.getMessage(), e);
            }

            if (attempt < maxRetries - 1) {
                long delayMs = exponentialBackoff
                        ? initialDelayMs * (1L << attempt)
                        : initialDelayMs;
                logger.info("Retrying {} in {}ms", operationName, delayMs);
                sleepBeforeRetry(delayMs, operationName);
            }
        }

        return false;
    }

    private static void sleepBeforeRetry(long delayMs, String operationName) {
        try {
            Thread.sleep(delayMs);
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
            logger.warn("Interrupted while retrying {}", operationName);
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

    static EventMetadata initializeEventMetadata(EventMetadata eventMetadata, String organiserId) {
        EventMetadata resolvedMetadata = eventMetadata != null ? eventMetadata : new EventMetadata();

        if (resolvedMetadata.getOrganiserId() == null || resolvedMetadata.getOrganiserId().isBlank()) {
            resolvedMetadata.setOrganiserId(organiserId);
        }
        if (resolvedMetadata.getPurchaserMap() == null) {
            resolvedMetadata.setPurchaserMap(new HashMap<>());
        }
        if (resolvedMetadata.getCompleteTicketCount() == null) {
            resolvedMetadata.setCompleteTicketCount(0);
        }
        if (resolvedMetadata.getCompletedStripeCheckoutSessionIds() == null) {
            resolvedMetadata.setCompletedStripeCheckoutSessionIds(new ArrayList<>());
        }
        if (resolvedMetadata.getCompletedStripePaymentIntentIds() == null) {
            resolvedMetadata.setCompletedStripePaymentIntentIds(new ArrayList<>());
        }
        if (resolvedMetadata.getOrderIds() == null) {
            resolvedMetadata.setOrderIds(new ArrayList<>());
        }

        return resolvedMetadata;
    }

    static EventMetadata applyAttendanceToEventMetadata(
            EventMetadata eventMetadata,
            String organiserId,
            String customerEmail,
            String fullName,
            String phoneNumber,
            int ticketCount,
            List<String> formResponseIds) {

        if (customerEmail == null || customerEmail.isBlank()) {
            throw new IllegalArgumentException("Customer email is required to update event metadata.");
        }
        if (fullName == null || fullName.isBlank()) {
            throw new IllegalArgumentException("Attendee full name is required to update event metadata.");
        }
        if (ticketCount <= 0) {
            throw new IllegalArgumentException("Ticket count must be positive to update event metadata.");
        }

        EventMetadata resolvedMetadata = initializeEventMetadata(eventMetadata, organiserId);
        Map<String, Purchaser> purchaserMap = resolvedMetadata.getPurchaserMap();

        String emailHash = hashEmail(customerEmail);
        Purchaser purchaser = purchaserMap.get(emailHash);
        if (purchaser == null) {
            purchaser = new Purchaser();
            purchaser.setEmail(customerEmail);
            purchaser.setAttendees(new HashMap<>());
            purchaser.setTotalTicketCount(0);
        }

        purchaser.setEmail(customerEmail);
        int currentPurchaserTicketCount = Optional.ofNullable(purchaser.getTotalTicketCount()).orElse(0);
        purchaser.setTotalTicketCount(currentPurchaserTicketCount + ticketCount);

        Map<String, Attendee> attendees = purchaser.getAttendees();
        if (attendees == null) {
            attendees = new HashMap<>();
            purchaser.setAttendees(attendees);
        }

        Attendee attendee = attendees.get(fullName);
        if (attendee == null) {
            attendee = new Attendee();
            attendee.setPhone(phoneNumber);
            attendee.setTicketCount(ticketCount);
            attendee.setFormResponseIds(formResponseIds != null ? new ArrayList<>(formResponseIds) : new ArrayList<>());
        } else {
            attendee.setPhone(phoneNumber);
            int currentAttendeeTicketCount = Optional.ofNullable(attendee.getTicketCount()).orElse(0);
            attendee.setTicketCount(currentAttendeeTicketCount + ticketCount);

            List<String> existingFormResponses = attendee.getFormResponseIds();
            if (existingFormResponses == null) {
                existingFormResponses = new ArrayList<>();
            }
            if (formResponseIds != null && !formResponseIds.isEmpty()) {
                for (String formResponseId : formResponseIds) {
                    if (formResponseId != null
                            && !formResponseId.isBlank()
                            && !existingFormResponses.contains(formResponseId)) {
                        existingFormResponses.add(formResponseId);
                    }
                }
            }
            attendee.setFormResponseIds(existingFormResponses);
        }

        attendees.put(fullName, attendee);
        purchaserMap.put(emailHash, purchaser);
        resolvedMetadata.setCompleteTicketCount(resolvedMetadata.getCompleteTicketCount() + ticketCount);

        return resolvedMetadata;
    }

    static EventMetadata rollbackAttendanceFromEventMetadata(
            EventMetadata eventMetadata,
            String organiserId,
            String customerEmail,
            String fullName,
            List<Ticket> tickets) {

        EventMetadata resolvedMetadata = initializeEventMetadata(eventMetadata, organiserId);
        int canceledTicketCount = tickets != null ? tickets.size() : 0;
        if (canceledTicketCount <= 0) {
            return resolvedMetadata;
        }

        Integer completeTicketCount = resolvedMetadata.getCompleteTicketCount();
        int currentCompleteTicketCount = completeTicketCount != null ? completeTicketCount : 0;
        resolvedMetadata.setCompleteTicketCount(Math.max(0, currentCompleteTicketCount - canceledTicketCount));

        if (customerEmail == null || customerEmail.isBlank() || fullName == null || fullName.isBlank()) {
            return resolvedMetadata;
        }

        Map<String, Purchaser> purchaserMap = resolvedMetadata.getPurchaserMap();
        if (purchaserMap == null) {
            return resolvedMetadata;
        }

        String emailHash = hashEmail(customerEmail);
        Purchaser purchaser = purchaserMap.get(emailHash);
        if (purchaser == null) {
            return resolvedMetadata;
        }

        int currentPurchaserTicketCount = purchaser.getTotalTicketCount() != null ? purchaser.getTotalTicketCount() : 0;
        purchaser.setTotalTicketCount(Math.max(0, currentPurchaserTicketCount - canceledTicketCount));

        Map<String, Attendee> attendees = purchaser.getAttendees();
        if (attendees != null) {
            Attendee attendee = attendees.get(fullName);
            if (attendee != null) {
                int currentAttendeeTicketCount = attendee.getTicketCount() != null ? attendee.getTicketCount() : 0;
                attendee.setTicketCount(Math.max(0, currentAttendeeTicketCount - canceledTicketCount));

                List<String> remainingFormResponseIds = attendee.getFormResponseIds() != null
                        ? new ArrayList<>(attendee.getFormResponseIds())
                        : new ArrayList<>();
                for (Ticket ticket : tickets) {
                    String formResponseId = ticket.getFormResponseId();
                    if (formResponseId != null && !formResponseId.isBlank()) {
                        remainingFormResponseIds.remove(formResponseId);
                    }
                }
                attendee.setFormResponseIds(remainingFormResponseIds);

                if (attendee.getTicketCount() != null && attendee.getTicketCount() <= 0) {
                    attendees.remove(fullName);
                } else {
                    attendees.put(fullName, attendee);
                }
            }
        }

        if ((purchaser.getAttendees() == null || purchaser.getAttendees().isEmpty())
                && purchaser.getTotalTicketCount() != null
                && purchaser.getTotalTicketCount() <= 0) {
            purchaserMap.remove(emailHash);
        } else {
            purchaserMap.put(emailHash, purchaser);
        }

        return resolvedMetadata;
    }

    private static void appendUniqueValue(List<String> values, String value) {
        if (values == null || value == null || value.isBlank()) {
            return;
        }
        if (!values.contains(value)) {
            values.add(value);
        }
    }

    private static EventMetadata getOrInitializeEventMetadata(
            Transaction transaction,
            DocumentReference eventMetadataRef,
            String organiserId) throws Exception {

        DocumentSnapshot metadataSnapshot = transaction.get(eventMetadataRef).get();
        EventMetadata existingEventMetadata = metadataSnapshot.exists()
                ? metadataSnapshot.toObject(EventMetadata.class)
                : null;
        return initializeEventMetadata(existingEventMetadata, organiserId);
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
    private static String fulfillCompletedEventTicketPurchase(
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
        DocumentReference eventRef = db.collection(CollectionPaths.EVENTS)
            .document(CollectionPaths.ACTIVE)
            .collection(privacyPath)
            .document(eventId);
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
        
        LineItem item = getSingleCheckoutLineItem(lineItems, checkoutSessionId, false);
        if (item == null) {
            return null;
        }

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
        
        // Read event metadata
        ApiFuture<DocumentSnapshot> metadataFuture = transaction.get(eventMetadataRef);
        DocumentSnapshot maybeEventMetadata = metadataFuture.get();
        
        EventMetadata existingEventMetadata = maybeEventMetadata.exists()
                ? maybeEventMetadata.toObject(EventMetadata.class)
                : null;
        EventMetadata eventMetadata = initializeEventMetadata(existingEventMetadata, event.getOrganiserId());
        
        // Create order and tickets
        Timestamp purchaseTime = Timestamp.now();
        DocumentReference orderRef = db.collection(CollectionPaths.ORDERS).document();
        
        long applicationFees = resolveApplicationFees(totalDetails);
        long discounts = resolveDiscounts(totalDetails);
        
        // Resolve status based on capture method
        OrderAndTicketStatus status = resolveOrderAndTicketStatus(captureMethod);
        eventMetadata = applyAttendanceToEventMetadata(
                eventMetadata,
                event.getOrganiserId(),
                customerEmail,
                fullName,
                phoneNumber,
                quantity.intValue(),
                formResponseIds);
        logger.info("Updated attendee list to reflect newly purchased tickets. email={}, name={}",
                LogSanitizer.redactEmail(customerEmail), fullName);
        
        List<String> ticketIds = new ArrayList<>();
        
        // Create tickets
        for (int i = 0; i < quantity; i++) {
            DocumentReference ticketRef = db.collection(CollectionPaths.TICKETS).document();
            
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

        appendUniqueValue(eventMetadata.getOrderIds(), orderRef.getId());
        appendUniqueValue(eventMetadata.getCompletedStripeCheckoutSessionIds(), checkoutSessionId);
        transaction.set(eventMetadataRef, eventMetadata);
        
        return orderRef.getId();
    }

    static long resolveApplicationFees(Session.TotalDetails totalDetails) {
        if (totalDetails == null || totalDetails.getAmountShipping() == null) {
            return 0L;
        }
        return totalDetails.getAmountShipping();
    }

    static long resolveDiscounts(Session.TotalDetails totalDetails) {
        if (totalDetails == null || totalDetails.getAmountDiscount() == null) {
            return 0L;
        }
        return totalDetails.getAmountDiscount();
    }

    private static void restockTickets(
            Transaction transaction,
            String eventId,
            boolean isPrivate,
            int ticketCount) throws Exception {

        Firestore db = FirebaseService.getFirestore();
        String privacyPath = isPrivate ? CollectionPaths.PRIVATE : CollectionPaths.PUBLIC;
        DocumentReference eventRef = db.collection(CollectionPaths.EVENTS)
                .document(CollectionPaths.ACTIVE)
                .collection(privacyPath)
                .document(eventId);

        DocumentSnapshot eventSnapshot = transaction.get(eventRef).get();
        if (!eventSnapshot.exists()) {
            throw new IllegalStateException("Event does not exist for restock. eventId=" + eventId);
        }

        transaction.update(eventRef, "vacancy", FieldValue.increment(ticketCount));
    }

    private static void updateTicketsStatusToRejected(
            Transaction transaction,
            List<String> ticketIds) {

        Firestore db = FirebaseService.getFirestore();
        for (String ticketId : ticketIds) {
            DocumentReference ticketRef = db.collection(CollectionPaths.TICKETS).document(ticketId);
            transaction.update(ticketRef, "status", OrderAndTicketStatus.REJECTED.name());
            logger.info("Updated ticket {} status to REJECTED", ticketId);
        }
    }

    private static void updateOrderStatusToRejected(
            Transaction transaction,
            String orderId) {

        Firestore db = FirebaseService.getFirestore();
        DocumentReference orderRef = db.collection(CollectionPaths.ORDERS).document(orderId);
        transaction.update(orderRef, "status", OrderAndTicketStatus.REJECTED.name());
        logger.info("Updated order {} status to REJECTED", orderId);
    }

    /**
     * Handles payment intent cancellation side effects within a transaction.
     */
    private static void handlePaymentIntentCancellation(
            Transaction transaction,
            String paymentIntentId,
            String eventId,
            String organiserId,
            boolean isPrivate,
            String orderId,
            List<String> ticketIds) throws Exception {

        Firestore db = FirebaseService.getFirestore();
        DocumentReference eventMetadataRef = db.collection(CollectionPaths.EVENTS_METADATA).document(eventId);
        EventMetadata eventMetadata = getOrInitializeEventMetadata(transaction, eventMetadataRef, organiserId);
        Order order = OrdersRepository.getOrderById(orderId, Optional.of(transaction))
                .orElseThrow(() -> new IllegalStateException("Order not found for payment intent cancellation: " + orderId));
        List<Ticket> tickets = TicketsRepository.getTicketsByIds(ticketIds, Optional.of(transaction));
        if (tickets.size() != ticketIds.size()) {
            throw new IllegalStateException(String.format(
                    "Expected %d tickets for order %s but found %d",
                    ticketIds.size(),
                    orderId,
                    tickets.size()));
        }

        eventMetadata = rollbackAttendanceFromEventMetadata(
                eventMetadata,
                organiserId,
                order.getEmail(),
                order.getFullName(),
                tickets);

        restockTickets(transaction, eventId, isPrivate, tickets.size());
        updateTicketsStatusToRejected(transaction, ticketIds);
        updateOrderStatusToRejected(transaction, orderId);

        appendUniqueValue(eventMetadata.getCompletedStripePaymentIntentIds(), paymentIntentId);
        transaction.set(eventMetadataRef, eventMetadata);
        logger.info("Added payment intent {} to completedStripePaymentIntentIds for event {}",
                paymentIntentId, eventId);
    }

    public static boolean sendPurchaseEmailWithRetries(
            String eventId,
            String visibility,
            String customerEmail,
            String fullName,
            String orderId) {

        return sendPurchaseEmailWithRetries(
                eventId,
                visibility,
                customerEmail,
                fullName,
                orderId,
                MAX_PURCHASE_EMAIL_RETRIES,
                PURCHASE_EMAIL_INITIAL_RETRY_DELAY_MS,
                EmailService::sendPurchaseEmail);
    }

    static boolean sendPurchaseEmailWithRetries(
            String eventId,
            String visibility,
            String customerEmail,
            String fullName,
            String orderId,
            int maxRetries,
            long initialRetryDelayMs,
            PurchaseEmailSender purchaseEmailSender) {

        return retryBooleanOperation(
                "send purchase email",
                maxRetries,
                initialRetryDelayMs,
                true,
                () -> purchaseEmailSender.send(eventId, visibility, customerEmail, fullName, orderId));
    }
    
    /**
     * Records a checkout session by customer email for tracking purposes.
     * 
     * @param transaction The Firestore transaction
     * @param eventId The event ID
     * @param checkoutSession The Stripe checkout session
     * @param customerEmail The customer's email
     */
    private static void recordCheckoutSessionByCustomerEmail(
            Transaction transaction,
            String eventId,
            Session checkoutSession,
            String customerEmail) throws Exception {
        
        Firestore db = FirebaseService.getFirestore();
        
        String emailHash = hashEmail(customerEmail);
        DocumentReference attendeeRef = db.collection(CollectionPaths.ATTENDEES).document("emails")
            .collection(emailHash).document(eventId);
        
        Map<String, Object> data = new HashMap<>();
        data.put("checkout_sessions", FieldValue.arrayUnion(serializeCheckoutSessionForFirestore(checkoutSession)));
        
        transaction.set(attendeeRef, data, com.google.cloud.firestore.SetOptions.merge());
    }

    private static LineItem getSingleCheckoutLineItem(
            List<LineItem> lineItems,
            String checkoutSessionId,
            boolean expiredCheckout) {

        String checkoutType = expiredCheckout ? "expired checkout" : "checkout";
        if (lineItems == null || lineItems.isEmpty()) {
            logger.error("Line items are empty for {} session {}", checkoutType, checkoutSessionId);
            return null;
        }

        // CheckoutService creates one Stripe line item per event purchase and stores ticket count
        // on that item's quantity. Reject any other payload shape so multi-item checkouts cannot
        // quietly under-restock or mis-price tickets.
        if (lineItems.size() != 1) {
            logger.error("Expected exactly 1 line item for {} session {} but found {}",
                    checkoutType, checkoutSessionId, lineItems.size());
            return null;
        }

        return lineItems.get(0);
    }

    static long getRequiredCheckoutQuantity(
            List<LineItem> lineItems,
            String checkoutSessionId,
            boolean expiredCheckout) {

        LineItem item = getSingleCheckoutLineItem(lineItems, checkoutSessionId, expiredCheckout);
        String checkoutType = expiredCheckout ? "expired checkout" : "checkout";
        if (item == null) {
            throw new IllegalStateException(
                    String.format("Unable to read line item for %s session %s", checkoutType, checkoutSessionId));
        }

        Long quantity = item.getQuantity();
        if (quantity == null) {
            logger.error("Item quantity is null for {} session {}", checkoutType, checkoutSessionId);
            throw new IllegalStateException(
                    String.format("Missing quantity for %s session %s", checkoutType, checkoutSessionId));
        }

        return quantity;
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
    private static void restockTicketsAfterExpiredCheckout(
            Transaction transaction,
            String checkoutSessionId,
            String eventId,
            boolean isPrivate,
            List<LineItem> lineItems) throws Exception {
        
        Firestore db = FirebaseService.getFirestore();
        String privacyPath = isPrivate ? CollectionPaths.PRIVATE : CollectionPaths.PUBLIC;

        DocumentReference eventRef = db.collection(CollectionPaths.EVENTS)
            .document(CollectionPaths.ACTIVE)
            .collection(privacyPath)
            .document(eventId);
        DocumentReference eventMetadataRef = db.collection(CollectionPaths.EVENTS_METADATA).document(eventId);
        
        long quantity = getRequiredCheckoutQuantity(lineItems, checkoutSessionId, true);
        
        // Verify event exists before updating vacancy to avoid transaction commit failures
        ApiFuture<DocumentSnapshot> eventFuture = transaction.get(eventRef);
        DocumentSnapshot eventSnapshot = eventFuture.get();
        
        if (!eventSnapshot.exists()) {
            logger.error("Unable to find event to restock tickets for expired checkout. eventId={}, isPrivate={}", 
                        eventId, isPrivate);
            throw new IllegalStateException("Event does not exist: eventId=" + eventId);
        }
        
        // Firestore transactions require all reads to complete before the first write.
        EventMetadata eventMetadata = getOrInitializeEventMetadata(
                transaction,
                eventMetadataRef,
                eventSnapshot.getString("organiserId"));
        appendUniqueValue(eventMetadata.getCompletedStripeCheckoutSessionIds(), checkoutSessionId);

        // Restock the tickets
        transaction.update(eventRef, "vacancy", FieldValue.increment(quantity));
        transaction.set(eventMetadataRef, eventMetadata);
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
                                    "customer={}", checkoutSessionId, eventId,
                                LogSanitizer.redactEmail(customerEmail));
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
                // Keep fulfilment completion out of the checkout transaction. It opens its own
                // Firestore transaction and touches additional workflow state, so coupling it to
                // the payment write path would increase contention and could roll back the critical
                // order/ticket persistence after Stripe has already told us the checkout succeeded.
                // TODO: look into how we can robustly not have hanging fulfilment sessions when the initial webhook
                // payment process has gone through.
                boolean fulfilmentCompleted = retryBooleanOperation(
                        "complete fulfilment session",
                        MAX_FULFILMENT_RETRIES,
                        FULFILMENT_RETRY_DELAY_MS,
                        false,
                        () -> FulfilmentService.completeFulfilmentSession(fulfilmentSessionId, endFulfilmentEntityId));
                if (!fulfilmentCompleted) {
                    logger.warn("Was unable to complete fulfilment session {} after {} attempts",
                            fulfilmentSessionId, MAX_FULFILMENT_RETRIES);
                }
            }
            
            String visibility = isPrivate ? "Private" : "Public";
            boolean emailSuccess = sendPurchaseEmailWithRetries(
                    eventId,
                    visibility,
                    customerEmail,
                    fullName,
                    orderId);
            
            if (!emailSuccess) {
                logger.warn("Was unable to send purchase email after EmailClient retries. orderId={}, customer={}",
                        orderId, LogSanitizer.redactEmail(customerEmail));
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

    /**
     * Handles payment_intent.canceled webhook workflow:
     * - Restock tickets
     * - Mark order/tickets as REJECTED
     * - Record payment intent idempotency marker
     * - Send cancellation email (best effort)
     *
     * @param paymentIntentId Stripe payment intent ID
     * @return true if webhook should be considered successfully processed
     */
    public static boolean fulfilmentWorkflowOnPaymentIntentCanceled(String paymentIntentId) {
        try {
            Optional<Order> maybeOrder = OrdersRepository.getOrderByStripePaymentIntentId(paymentIntentId);
            if (maybeOrder.isEmpty()) {
                logger.warn("No order found with payment intent ID: {}", paymentIntentId);
                return true;
            }

            Order order = maybeOrder.get();
            String orderId = order.getOrderId();
            List<String> ticketIds = order.getTickets() != null ? order.getTickets() : new ArrayList<>();
            if (orderId == null || orderId.isBlank()) {
                logger.error("Order data incomplete for payment intent {}: orderId missing", paymentIntentId);
                return false;
            }
            if (ticketIds.isEmpty()) {
                logger.error("Order {} has no tickets for payment intent {}", orderId, paymentIntentId);
                return false;
            }

            Optional<Ticket> maybeFirstTicket = TicketsRepository.getTicketById(ticketIds.get(0));
            if (maybeFirstTicket.isEmpty()) {
                logger.error("First ticket {} not found for order {}", ticketIds.get(0), orderId);
                return false;
            }

            Ticket firstTicket = maybeFirstTicket.get();
            String eventId = firstTicket.getEventId();
            if (eventId == null || eventId.isBlank()) {
                logger.error("Event ID not found in ticket {} for order {}", ticketIds.get(0), orderId);
                return false;
            }

            Firestore db = FirebaseService.getFirestore();
            DocumentReference privateEventRef = db.collection(CollectionPaths.EVENTS)
                    .document(CollectionPaths.ACTIVE)
                    .collection(CollectionPaths.PRIVATE)
                    .document(eventId);
            DocumentReference publicEventRef = db.collection(CollectionPaths.EVENTS)
                    .document(CollectionPaths.ACTIVE)
                    .collection(CollectionPaths.PUBLIC)
                    .document(eventId);
            List<DocumentSnapshot> eventSnapshots = db.getAll(privateEventRef, publicEventRef).get();
            DocumentSnapshot privateEvent = eventSnapshots.get(0);
            DocumentSnapshot publicEvent = eventSnapshots.get(1);

            if (!privateEvent.exists() && !publicEvent.exists()) {
                logger.error("Event {} not found in either Private or Public collections", eventId);
                return false;
            }
            boolean isPrivate = privateEvent.exists();
            DocumentSnapshot eventSnapshot = isPrivate ? privateEvent : publicEvent;
            String organiserId = eventSnapshot.getString("organiserId");

            PaymentIntentCancellationTransactionResult transactionResult =
                    FirebaseService.createFirestoreTransaction(transaction -> {
                        try {
                            if (checkIfPaymentIntentHasBeenProcessedAlready(transaction, paymentIntentId, eventId)) {
                                logger.info("Payment intent {} has already been processed. Returning early.",
                                        paymentIntentId);
                                return PaymentIntentCancellationTransactionResult.ALREADY_PROCESSED;
                            }

                            handlePaymentIntentCancellation(
                                    transaction,
                                    paymentIntentId,
                                    eventId,
                                    organiserId,
                                    isPrivate,
                                    orderId,
                                    ticketIds);

                            return PaymentIntentCancellationTransactionResult.PROCESSED;
                        } catch (Exception e) {
                            logger.error("Error in payment intent cancellation transaction for {}: {}",
                                    paymentIntentId, e.getMessage(), e);
                            throw new RuntimeException("Transaction failed", e);
                        }
                    });

            if (transactionResult == PaymentIntentCancellationTransactionResult.ALREADY_PROCESSED) {
                return true;
            }

            String eventName = "Event";
            if (eventSnapshot.exists()) {
                String resolvedName = eventSnapshot.getString("name");
                if (resolvedName != null && !resolvedName.isBlank()) {
                    eventName = resolvedName;
                }
            }

            String email = order.getEmail();
            if (email != null && !email.isBlank()) {
                boolean emailSent = EmailService.sendCancellationEmail(
                        email,
                        order.getFullName(),
                        eventName,
                        orderId,
                        ticketIds.size());
                if (!emailSent) {
                    logger.warn("Was unable to send cancellation email to {}. orderId={}",
                            LogSanitizer.redactEmail(email), orderId);
                }
            } else {
                logger.warn("No email found in order to send cancellation email. orderId={}", orderId);
            }

            logger.info("Successfully handled payment_intent.canceled webhook event. paymentIntentId={}, orderId={}",
                    paymentIntentId, orderId);
            return true;
        } catch (Exception e) {
            logger.error("Error processing payment_intent.canceled workflow for {}: {}",
                    paymentIntentId, e.getMessage(), e);
            return false;
        }
    }
}
