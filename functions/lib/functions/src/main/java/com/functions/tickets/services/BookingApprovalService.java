package com.functions.tickets.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventData;
import com.functions.events.repositories.EventsRepository;
import com.functions.stripe.services.StripeService;
import com.functions.tickets.models.BookingApprovalOperation;
import com.functions.tickets.models.Order;
import com.functions.tickets.models.OrderAndTicketStatus;
import com.functions.tickets.repositories.OrdersRepository;
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

            String stripePaymentIntentId = order.getStripePaymentIntentId();

            boolean success = false;
            if (operation == BookingApprovalOperation.APPROVE) {
                success = executeApprovalOperation(stripePaymentIntentId, userData.getStripeAccount(), orderId);
            } else if (operation == BookingApprovalOperation.REJECT) {
                success = executeRejectionOperation(stripePaymentIntentId, userData.getStripeAccount(), orderId,
                        order.getTickets().size());
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
            String orderId) {
        try {
            StripeService.capturePaymentIntent(stripePaymentIntentId, stripeAccountId);
            TicketsService.updateOrderAndTicketStatus(orderId, OrderAndTicketStatus.APPROVED);
        // send emails
            return true;
        } catch (StripeException e){
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
            String orderId, int numTicketsInOrder) {
        try {
            StripeService.cancelPaymentIntent(stripePaymentIntentId, stripeAccountId);
            TicketsService.updateOrderAndTicketStatus(orderId, OrderAndTicketStatus.REJECTED);
            // TODO use the refund function to refund the tickets
            return true;
        } catch (StripeException e){
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
