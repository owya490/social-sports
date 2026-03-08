package com.functions.tickets.services;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.emails.EmailService;
import com.functions.events.models.EventData;
import com.functions.events.repositories.EventsRepository;
import com.functions.stripe.services.StripeService;
import com.functions.tickets.models.BookingApprovalOperation;
import com.functions.tickets.models.Order;
import com.functions.tickets.models.OrderAndTicketStatus;
import com.functions.tickets.models.Ticket;
import com.functions.tickets.repositories.OrdersRepository;
import com.functions.tickets.repositories.TicketsRepository;
import com.functions.users.models.UserData;
import com.functions.users.services.Users;
import com.stripe.exception.StripeException;

public class BookingApprovalService {
    private static final Logger logger = LoggerFactory.getLogger(BookingApprovalService.class);

    public static boolean handleBookingApproval(String eventId, String organiserId, String orderId,
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

            List<Ticket> tickets = TicketsRepository.getTicketsByIds(order.getTickets());
            for (Ticket ticket : tickets) {
                if (!ticket.getEventId().equals(eventId)) {
                    throw new RuntimeException(
                            String.format("Ticket eventId mismatch for ticket %s. Expected %s, got %s",
                                    ticket.getTicketId(), eventId, ticket.getEventId()));
                }
            }

            String stripePaymentIntentId = order.getStripePaymentIntentId();

            boolean success = false;
            if (operation == BookingApprovalOperation.APPROVE) {
                success = executeApprovalOperation(stripePaymentIntentId, userData.getStripeAccount(), order,
                        eventData);
            } else if (operation == BookingApprovalOperation.REJECT) {
                success = executeRejectionOperation(stripePaymentIntentId, userData.getStripeAccount(), orderId);
            } else {
                logger.error("Invalid booking approval operation for orderId: {}, operation: {}", orderId, operation);
                throw new RuntimeException(String.format(
                        "Invalid booking approval operation for orderId: %s, operation: %s", orderId, operation));
            }

            return success;
        } catch (Exception e) {
            logger.error(
                    "Failed to handle booking approval for eventId: {}, organiserId: {}, orderId: {}, operation: {}",
                    eventId, organiserId, orderId, operation, e);
            throw new RuntimeException("Failed to handle booking approval", e);
        }
    }

    private static boolean executeApprovalOperation(String stripePaymentIntentId, String stripeAccountId,
            Order order, EventData eventData) {
        String orderId = order.getOrderId();
        try {
            logger.info("Executing approval operation for stripePaymentIntentId: {}, stripeAccountId: {}, orderId: {}",
                    stripePaymentIntentId, stripeAccountId, orderId);
            StripeService.capturePaymentIntent(stripePaymentIntentId, stripeAccountId);
            logger.info(
                    "Successfully captured PaymentIntent for stripePaymentIntentId: {}, stripeAccountId: {}, orderId: {}",
                    stripePaymentIntentId, stripeAccountId, orderId);
            TicketsService.updateOrderAndTicketStatus(orderId, OrderAndTicketStatus.APPROVED);
            logger.info("Successfully updated order and ticket status for orderId: {}", orderId);

            // Send purchase confirmation email to the attendee
            EmailService.sendPurchaseConfirmationEmail(order, eventData);

            return true;
        } catch (StripeException e) {
            logger.error(
                    "Failed to capture PaymentIntent for stripePaymentIntentId: {}, stripeAccountId: {}, orderId: {}",
                    stripePaymentIntentId, stripeAccountId, orderId, e);
            return false;
        } catch (Exception e) {
            logger.error(
                    "Failed to execute approval operation for stripePaymentIntentId: {}, stripeAccountId: {}, orderId: {}",
                    stripePaymentIntentId, stripeAccountId, orderId, e);
            return false;
        }
    }

    private static boolean executeRejectionOperation(String stripePaymentIntentId, String stripeAccountId,
            String orderId) {
        try {
            logger.info(
                    "Executing rejection operation for stripePaymentIntentId: {}, stripeAccountId: {}, orderId: {}",
                    stripePaymentIntentId, stripeAccountId, orderId);
            StripeService.cancelPaymentIntent(stripePaymentIntentId, stripeAccountId);
            logger.info(
                    "Successfully cancelled PaymentIntent for stripePaymentIntentId: {}, stripeAccountId: {}, orderId: {}",
                    stripePaymentIntentId, stripeAccountId, orderId);
            TicketsService.updateOrderAndTicketStatus(orderId, OrderAndTicketStatus.REJECTED);
            logger.info("Successfully updated order and ticket status for orderId: {}", orderId);
            // Ticket restocking logic and emails are handled in the stripe webhook under
            // the name of payment_intent.canceled, this just ensures we capture both manual
            // rejected tickets and also time based expirations.
            return true;
        } catch (StripeException e) {
            logger.error(
                    "Failed to cancel PaymentIntent for stripePaymentIntentId: {}, stripeAccountId: {}, orderId: {}",
                    stripePaymentIntentId, stripeAccountId, orderId, e);
            return false;
        } catch (Exception e) {
            logger.error(
                    "Failed to execute rejection operation for stripePaymentIntentId: {}, stripeAccountId: {}, orderId: {}",
                    stripePaymentIntentId, stripeAccountId, orderId, e);
            return false;
        }
    }
}
