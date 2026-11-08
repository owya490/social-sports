package com.functions.stripe.services;

import static com.functions.stripe.services.WebhookService.initializeEventMetadata;
import static com.functions.stripe.services.WebhookService.resolveOrderAndTicketStatus;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventData;
import com.functions.events.models.EventMetadata;
import com.functions.events.models.ResolvedEventTicketType;
import com.functions.events.services.EventTicketTypeService;
import com.functions.firebase.services.FirebaseService;
import com.functions.firebase.services.FirebaseService.CollectionPaths;
import com.functions.fulfilment.models.fulfilmentEntities.FormsFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;
import com.functions.tickets.models.Order;
import com.functions.tickets.models.OrderAndTicketStatus;
import com.functions.tickets.models.Ticket;
import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;

/**
 * Creates tickets and an order for a completed event purchase.
 */
public class EventTicketPurchaseService {
    private static final Logger logger = LoggerFactory.getLogger(EventTicketPurchaseService.class);

    private EventTicketPurchaseService() {
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
     * Creates tickets and an order for one completed purchase and updates event metadata in memory.
     * The caller writes that document once, after adding its own idempotency key.
     * A null fee, discount, phone, or payment intent is stored as zero or absent.
     * A null capture method is approved.
     *
     * @return the purchase, or null when the event does not exist
     */
    public static MintedPurchase fulfillCompletedEventTicketPurchase(
            Transaction transaction,
            String eventId,
            boolean isPrivate,
            int quantity,
            long unitPriceCents,
            String eventTicketTypeId,
            String customerEmail,
            String fullName,
            String fulfilmentSessionId,
            String phoneNumber,
            Long applicationFees,
            Long discounts,
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
        event.setEventId(eventId);

        ResolvedEventTicketType ticketType = EventTicketTypeService.resolveById(event, eventTicketTypeId);

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

        long fees = applicationFees == null ? 0L : applicationFees;
        long discountAmount = discounts == null ? 0L : discounts;

        // Resolve status based on capture method
        OrderAndTicketStatus status = resolveOrderAndTicketStatus(captureMethod);
        // completeTicketCount is used by dashboards (EventDrilldownStatBanner, AttendeeService,
        // ReservedSlotService) so it is kept up to date; purchaserMap is deprecated and no
        // longer written.
        eventMetadata.setCompleteTicketCount(eventMetadata.getCompleteTicketCount() + quantity);
        logger.info("Incremented completeTicketCount for event {}. email={}, name={}",
                eventId, customerEmail, fullName);

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
            ticket.setPrice(unitPriceCents);
            ticket.setPurchaseDate(purchaseTime);
            ticket.setStatus(status);
            ticket.setFormResponseId(formResponseId);
            EventTicketTypeService.stampTicket(ticket, ticketType);

            transaction.create(ticketRef, ticket);
            ticketIds.add(ticketRef.getId());
        }

        // Create order
        Order order = new Order();
        order.setOrderId(orderRef.getId());
        order.setDatePurchased(purchaseTime);
        order.setEmail(customerEmail);
        order.setFullName(fullName);
        order.setPhone(phoneNumber);
        order.setApplicationFees(fees);
        order.setDiscounts(discountAmount);
        order.setTickets(ticketIds);
        order.setStripePaymentIntentId(paymentIntentId);
        order.setStatus(status);

        transaction.set(orderRef, order);

        List<String> orderIds = eventMetadata.getOrderIds();
        if (orderIds != null && !orderIds.contains(orderRef.getId())) {
            orderIds.add(orderRef.getId());
        }

        return new MintedPurchase(orderRef.getId(), eventMetadata, eventMetadataRef);
    }

    public record MintedPurchase(
            String orderId,
            EventMetadata eventMetadata,
            DocumentReference eventMetadataRef) {
    }
}
