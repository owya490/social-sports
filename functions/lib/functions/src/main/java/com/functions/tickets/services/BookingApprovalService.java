package com.functions.tickets.services;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.emails.EmailService;
import com.functions.events.models.EventData;
import com.functions.events.repositories.EventsRepository;
import com.functions.firebase.services.FirebaseService;
import com.functions.stripe.models.PaymentIntentStatus;
import com.functions.stripe.services.StripeService;
import com.functions.stripe.services.WebhookService;
import com.functions.tickets.models.BookingApprovalOperation;
import com.functions.tickets.models.Order;
import com.functions.tickets.models.OrderAndTicketStatus;
import com.functions.tickets.models.Ticket;
import com.functions.tickets.models.responses.BookingApprovalResponse;
import com.functions.tickets.repositories.OrdersRepository;
import com.functions.tickets.repositories.TicketsRepository;
import com.functions.users.models.UserData;
import com.functions.users.services.Users;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.stripe.exception.InvalidRequestException;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;

public class BookingApprovalService {
    private static final Logger logger = LoggerFactory.getLogger(BookingApprovalService.class);

    @FunctionalInterface
    interface PurchaseEmailSender {
        boolean send(String eventId, String visibility, String customerEmail, String fullName, String orderId);
    }

    public static BookingApprovalResponse handleBookingApproval(String eventId, String organiserId, String orderId,
            BookingApprovalOperation operation) {
        logger.info("Handling booking approval for eventId: {}, organiserId: {}, orderId: {}, operation: {}", eventId,
                organiserId, orderId, operation);

        try {

            EventData eventData = EventsRepository.getEventById(eventId)
                    .orElseThrow(() -> new RuntimeException("Event not found " + eventId));

            if (!eventData.getOrganiserId().equals(organiserId)) {
                throw new RuntimeException("Organiser ID mismatch for event " + eventId);
            }

            UserData userData = Users.getUserDataById(organiserId);

            if (userData == null) {
                throw new RuntimeException("Organiser not found " + organiserId);
            }

            if (!userData.getStripeAccountActive()) {
                throw new RuntimeException("Organiser stripe account is not active " + organiserId);
            }

            Order order = OrdersRepository.getOrderById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found " + orderId));

            if (order.getStatus() != OrderAndTicketStatus.PENDING) {
                logger.warn("Order {} is no longer PENDING (current status: {}). "
                        + "A concurrent operation may have already processed this order.",
                        orderId, order.getStatus());
                throw new RuntimeException(String.format(
                        "Order %s is no longer PENDING (current status: %s). Cannot %s.",
                        orderId, order.getStatus(), operation));
            }

            List<Ticket> tickets = TicketsRepository.getTicketsByIds(order.getTickets());
            for (Ticket ticket : tickets) {
                if (!ticket.getEventId().equals(eventId)) {
                    throw new RuntimeException(
                            String.format("Ticket eventId mismatch for ticket %s. Expected %s, got %s",
                                    ticket.getTicketId(), eventId, ticket.getEventId()));
                }
            }

            String stripePaymentIntentId = order.getStripePaymentIntentId();
            String stripeAccountId = userData.getStripeAccount();

            PaymentIntent paymentIntent = StripeService.retrievePaymentIntent(stripePaymentIntentId, stripeAccountId);
            String piStatus = paymentIntent.getStatus();

            BookingApprovalResponse canceledResponse = checkAndSyncCanceledPaymentIntent(piStatus,
                    stripePaymentIntentId, orderId, operation);
            if (canceledResponse != null) {
                return canceledResponse;
            }

            if (operation == BookingApprovalOperation.APPROVE) {
                if (!PaymentIntentStatus.REQUIRES_CAPTURE.matches(piStatus)) {
                    logger.error("Cannot approve orderId: {}. PaymentIntent {} is in unexpected status: {}",
                            orderId, stripePaymentIntentId, piStatus);
                    throw new RuntimeException(String.format(
                            "Cannot approve order %s. PaymentIntent %s is in status '%s', expected '%s'.",
                            orderId, stripePaymentIntentId, piStatus,
                            PaymentIntentStatus.REQUIRES_CAPTURE.getStripeStatus()));
                }
                executeApprovalOperation(stripePaymentIntentId, stripeAccountId, order, eventData);
            } else if (operation == BookingApprovalOperation.REJECT) {
                executeRejectionOperation(stripePaymentIntentId, stripeAccountId, orderId);
            } else {
                logger.error("Invalid booking approval operation for orderId: {}, operation: {}", orderId, operation);
                throw new RuntimeException(String.format(
                        "Invalid booking approval operation for orderId: %s, operation: %s", orderId, operation));
            }

            return new BookingApprovalResponse(true, orderId, operation,
                    String.format("Successfully executed %s operation for order %s", operation, orderId));
        } catch (Exception e) {
            logger.error(
                    "Failed to handle booking approval for eventId: {}, organiserId: {}, orderId: {}, operation: {}",
                    eventId, organiserId, orderId, operation, e);
            throw new RuntimeException("Failed to handle booking approval", e);
        }
    }

    private static void executeApprovalOperation(String stripePaymentIntentId, String stripeAccountId,
            Order order, EventData eventData) throws StripeException {
        String orderId = order.getOrderId();

        logger.info("Executing approval operation for stripePaymentIntentId: {}, stripeAccountId: {}, orderId: {}",
                stripePaymentIntentId, stripeAccountId, orderId);
        StripeService.capturePaymentIntent(stripePaymentIntentId, stripeAccountId);
        logger.info(
                "Successfully captured PaymentIntent for stripePaymentIntentId: {}, stripeAccountId: {}, orderId: {}",
                stripePaymentIntentId, stripeAccountId, orderId);

        updateOrderAndTicketStatusWithRetry(orderId, OrderAndTicketStatus.APPROVED);

        // Send purchase confirmation email — isolated so a failure doesn't mask the
        // successful approval
        try {
            boolean purchaseEmailSent = sendPurchaseEmailAfterApproval(order, eventData);
            if (!purchaseEmailSent) {
                logger.warn("Failed to send purchase email after approving booking for orderId: {}", orderId);
            }
        } catch (Exception e) {
            logger.error("Failed to send purchase confirmation email for orderId: {}. "
                    + "Approval was successful but email delivery failed.", orderId, e);
        }
    }

    static boolean sendPurchaseEmailAfterApproval(Order order, EventData eventData) {
        return sendPurchaseEmailAfterApproval(order, eventData, EmailService::sendBookingApprovedEmail);
    }

    static boolean sendPurchaseEmailAfterApproval(
            Order order,
            EventData eventData,
            PurchaseEmailSender purchaseEmailSender) {
        String visibility = Boolean.TRUE.equals(eventData.getIsPrivate()) ? "Private" : "Public";
        return purchaseEmailSender.send(
                eventData.getEventId(),
                visibility,
                order.getEmail(),
                order.getFullName(),
                order.getOrderId());
    }

    private static void executeRejectionOperation(String stripePaymentIntentId, String stripeAccountId,
            String orderId) throws StripeException {
        logger.info(
                "Executing rejection operation for stripePaymentIntentId: {}, stripeAccountId: {}, orderId: {}",
                stripePaymentIntentId, stripeAccountId, orderId);
        StripeService.cancelPaymentIntent(stripePaymentIntentId, stripeAccountId);
        logger.info(
                "Successfully cancelled PaymentIntent for stripePaymentIntentId: {}, stripeAccountId: {}, orderId: {}",
                stripePaymentIntentId, stripeAccountId, orderId);

        updateOrderAndTicketStatusWithRetry(orderId, OrderAndTicketStatus.REJECTED);

        // Ticket restocking logic and emails are handled in the stripe webhook under
        // the name of payment_intent.canceled, this just ensures we capture both manual
        // rejected tickets and also time based expirations.
    }

    /**
     * Checks if the PaymentIntent has been canceled out-of-band (e.g. 7-day capture
     * window expiry). If so, syncs Firestore status to REJECTED and returns a
     * non-error response with a message explaining what happened.
     *
     * @return a BookingApprovalResponse if the PaymentIntent is canceled, or null
     *         if the PaymentIntent is still active and processing should continue.
     */
    private static BookingApprovalResponse checkAndSyncCanceledPaymentIntent(String piStatus,
            String stripePaymentIntentId, String orderId, BookingApprovalOperation operation) {
        if (!PaymentIntentStatus.CANCELED.matches(piStatus)) {
            return null;
        }

        logger.warn("PaymentIntent {} is already canceled for orderId: {}. "
                + "Syncing Firestore status to REJECTED.", stripePaymentIntentId, orderId);
        updateOrderAndTicketStatusWithRetry(orderId, OrderAndTicketStatus.REJECTED);
        String message = String.format(
                "Stripe Payment has expired or been canceled. Order %s has been automatically rejected.",
                orderId);
        return new BookingApprovalResponse(false, orderId, operation, message);
    }

    // -------------------------------------------------------------------------
    // 48-hour auto-expiry
    // -------------------------------------------------------------------------

    private static final long EXPIRY_WINDOW_HOURS = 48;

    /**
     * Result summary returned by {@link #expirePendingOrders()}.
     *
     * @param checked number of PENDING orders older than the expiry window that were processed
     * @param expired number of orders for which a cancellation was successfully triggered
     * @param errors  number of orders left in PENDING because an error prevented cancellation
     */
    public record ExpirePendingOrdersResult(int checked, int expired, int errors) {}

    /**
     * Queries all {@code PENDING} orders, filters those whose {@code datePurchased}
     * is older than {@link #EXPIRY_WINDOW_HOURS} hours, and attempts to cancel them.
     *
     * <ul>
     *   <li><b>Happy path</b>: Stripe cancellation succeeds. Stripe fires
     *       {@code payment_intent.canceled}, which the webhook handles (restock + status update + email).</li>
     *   <li><b>Redundancy A</b> (PI missing): {@code resource_missing} error from Stripe means the
     *       PaymentIntent was never created or is gone. Force the order to REJECTED directly via
     *       {@link WebhookService#fulfilmentWorkflowOnPaymentIntentCanceled}.</li>
     *   <li><b>Redundancy B</b> (PI exists, cancel failed): log the error and leave the order PENDING
     *       so we retry on the next cron run rather than losing data.</li>
     * </ul>
     *
     * @return a summary with counts of checked, expired, and errored orders
     */
    public static ExpirePendingOrdersResult expirePendingOrders() {
        int checked = 0;
        int expired = 0;
        int errors = 0;

        try {
            Firestore db = FirebaseService.getFirestore();
            Date cutoff = new Date(System.currentTimeMillis() - TimeUnit.HOURS.toMillis(EXPIRY_WINDOW_HOURS));

            QuerySnapshot querySnapshot = db.collection(FirebaseService.CollectionPaths.ORDERS)
                    .whereEqualTo("status", OrderAndTicketStatus.PENDING.name())
                    .get()
                    .get();

            for (QueryDocumentSnapshot doc : querySnapshot.getDocuments()) {
                Order order = doc.toObject(Order.class);
                if (order == null) {
                    continue;
                }
                order.setOrderId(doc.getId());

                if (order.getDatePurchased() == null
                        || !order.getDatePurchased().toDate().before(cutoff)) {
                    continue;
                }

                // This order has exceeded the 48-hour window
                checked++;
                try {
                    boolean triggered = expireSinglePendingOrder(order);
                    if (triggered) {
                        expired++;
                    } else {
                        errors++;
                    }
                } catch (Exception e) {
                    logger.error("Unexpected error expiring order {}. Leaving as PENDING.", order.getOrderId(), e);
                    errors++;
                }
            }

            logger.info("expirePendingOrders complete. checked={}, expired={}, errors={}", checked, expired, errors);
        } catch (Exception e) {
            logger.error("Failed to query PENDING orders for expiry", e);
        }

        return new ExpirePendingOrdersResult(checked, expired, errors);
    }

    /**
     * Attempts to expire a single PENDING order.
     *
     * @return {@code true} if a cancellation was successfully triggered or forced,
     *         {@code false} if the order should remain PENDING
     */
    private static boolean expireSinglePendingOrder(Order order) {
        String orderId = order.getOrderId();
        String paymentIntentId = order.getStripePaymentIntentId();

        if (paymentIntentId == null || paymentIntentId.isBlank()) {
            logger.error("Order {} has no stripePaymentIntentId. Cannot expire. Leaving as PENDING.", orderId);
            return false;
        }

        List<String> ticketIds = order.getTickets();
        if (ticketIds == null || ticketIds.isEmpty()) {
            logger.error("Order {} has no tickets. Cannot look up stripeAccountId. Leaving as PENDING.", orderId);
            return false;
        }

        Optional<Ticket> maybeFirstTicket = TicketsRepository.getTicketById(ticketIds.get(0));
        if (maybeFirstTicket.isEmpty()) {
            logger.error("First ticket {} not found for order {}. Cannot look up event. Leaving as PENDING.",
                    ticketIds.get(0), orderId);
            return false;
        }

        String eventId = maybeFirstTicket.get().getEventId();
        EventData eventData = EventsRepository.getEventById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found: " + eventId));

        String organiserId = eventData.getOrganiserId();
        UserData userData = Users.getUserDataById(organiserId);
        if (userData == null) {
            logger.error("Organiser {} not found for order {}. Cannot expire. Leaving as PENDING.",
                    organiserId, orderId);
            return false;
        }

        String stripeAccountId = userData.getStripeAccount();

        try {
            StripeService.cancelPaymentIntent(paymentIntentId, stripeAccountId);
            logger.info("Requested Stripe cancellation for expired PENDING order. orderId={}, paymentIntentId={}",
                    orderId, paymentIntentId);
            // Happy path: Stripe will fire payment_intent.canceled, handled by the webhook
            return true;
        } catch (InvalidRequestException e) {
            if ("resource_missing".equals(e.getCode())) {
                // Redundancy A: PI does not exist in Stripe. Force-reject the order so the
                // buyer gets their cancellation email and vacancy is restocked.
                logger.error("Stripe PaymentIntent {} does not exist (resource_missing) for order {}. "
                        + "Forcing order to REJECTED state directly. orderId={}, paymentIntentId={}",
                        paymentIntentId, orderId, orderId, paymentIntentId, e);
                boolean forceRejected = WebhookService.fulfilmentWorkflowOnPaymentIntentCanceled(paymentIntentId);
                if (!forceRejected) {
                    logger.error("Force-rejection failed for order {} (resource_missing path). "
                            + "Manual intervention may be required. orderId={}, paymentIntentId={}",
                            orderId, orderId, paymentIntentId);
                }
                return forceRejected;
            }
            // Redundancy B: PI exists but cancellation failed for another reason. Leave PENDING.
            logger.error("Stripe InvalidRequestException (non-resource_missing) while expiring order {}. "
                    + "Leaving as PENDING. paymentIntentId={}, stripeCode={}",
                    orderId, paymentIntentId, e.getCode(), e);
            return false;
        } catch (StripeException e) {
            // Redundancy B: any other Stripe failure — leave as PENDING
            logger.error("Stripe error while expiring order {}. Leaving as PENDING. paymentIntentId={}",
                    orderId, paymentIntentId, e);
            return false;
        }
    }

    private static final int MAX_FIRESTORE_RETRIES = 3;

    /**
     * Retries the Firestore status update up to MAX_FIRESTORE_RETRIES times.
     * This is critical because at this point Stripe has already been mutated
     * (capture/cancel), so we must persist the status change to avoid
     * inconsistency.
     */
    private static void updateOrderAndTicketStatusWithRetry(String orderId, OrderAndTicketStatus status) {
        for (int attempt = 1; attempt <= MAX_FIRESTORE_RETRIES; attempt++) {
            try {
                TicketsService.updateOrderAndTicketStatus(orderId, status);
                logger.info("Successfully updated order and ticket status for orderId: {} on attempt {}", orderId,
                        attempt);
                return;
            } catch (Exception e) {
                logger.error("Failed to update order and ticket status for orderId: {} on attempt {}/{}",
                        orderId, attempt, MAX_FIRESTORE_RETRIES, e);
                if (attempt == MAX_FIRESTORE_RETRIES) {
                    logger.error("CRITICAL: Stripe operation succeeded but Firestore status update failed after {} "
                            + "retries for orderId: {}. Manual intervention required. Target status: {}",
                            MAX_FIRESTORE_RETRIES, orderId, status);
                    throw new RuntimeException(String.format(
                            "Stripe operation succeeded but failed to update Firestore status for order %s after %d retries",
                            orderId, MAX_FIRESTORE_RETRIES), e);
                }
            }
        }
    }
}
