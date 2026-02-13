package com.functions.tickets.services;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.emails.EmailService;
import com.functions.events.models.EventData;
import com.functions.events.repositories.EventsRepository;
import com.functions.stripe.models.PaymentIntentStatus;
import com.functions.stripe.services.StripeService;
import com.functions.tickets.models.BookingApprovalOperation;
import com.functions.tickets.models.Order;
import com.functions.tickets.models.OrderAndTicketStatus;
import com.functions.tickets.models.Ticket;
import com.functions.tickets.models.responses.BookingApprovalResponse;
import com.functions.tickets.repositories.OrdersRepository;
import com.functions.tickets.repositories.TicketsRepository;
import com.functions.users.models.UserData;
import com.functions.users.services.Users;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;

public class BookingApprovalService {
    private static final Logger logger = LoggerFactory.getLogger(BookingApprovalService.class);

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
            EmailService.sendPurchaseConfirmationEmail(order, eventData);
        } catch (Exception e) {
            logger.error("Failed to send purchase confirmation email for orderId: {}. "
                    + "Approval was successful but email delivery failed.", orderId, e);
        }
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
                "PaymentIntent has expired or been canceled. Order %s has been automatically rejected.",
                orderId);
        return new BookingApprovalResponse(false, orderId, operation, message);
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
