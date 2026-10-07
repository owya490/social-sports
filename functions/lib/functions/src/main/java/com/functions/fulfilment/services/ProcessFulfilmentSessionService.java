package com.functions.fulfilment.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.emails.EmailService;
import com.functions.events.models.EventData;
import com.functions.fulfilment.models.fulfilmentSession.BookingApprovalFulfilmentSession;
import com.functions.fulfilment.models.fulfilmentSession.CheckoutFulfilmentSession;
import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;
import com.functions.fulfilment.models.fulfilmentSession.WaitlistFulfilmentSession;

/**
 * Handles one fulfilment session from the queue.
 * A completed session becomes tickets, an order, and a purchase email.
 * An expired session puts those tickets back on sale.
 */
public class ProcessFulfilmentSessionService {
    private static final Logger logger = LoggerFactory.getLogger(ProcessFulfilmentSessionService.class);

    public void process(String sessionJson) throws Exception {
        FulfilmentSession session;
        try {
            session = FulfilmentSession.fromJson(sessionJson);
        } catch (Exception e) {
            throw failure("Malformed fulfilment session message: " + e.getMessage(), e);
        }
        if (session.getStatus() == null) {
            String sessionId = session.getId() == null || session.getId().isBlank() ? "unknown" : session.getId();
            throw failure("Fulfilment session " + sessionId + " has no status");
        }
        if (session.getId() == null || session.getId().isBlank()) {
            throw failure("Fulfilment session message has no id");
        }
        if (session.getEventData() == null
                || session.getEventData().getEventId() == null
                || session.getEventData().getEventId().isBlank()) {
            throw failure("Fulfilment session " + session.getId() + " has no event");
        }
        RequestedTickets tickets = requestedTickets(session);
        if (tickets == null
                || tickets.count() == null
                || tickets.count() <= 0
                || tickets.ticketTypeId() == null
                || tickets.ticketTypeId().isBlank()) {
            throw failure("Fulfilment session " + session.getId() + " has no ticket quantity or ticket type");
        }

        switch (session.getStatus()) {
            case COMPLETED:
                if (tickets.priceCents() == null
                        || session.getPurchaserEmail() == null
                        || session.getPurchaserEmail().isBlank()) {
                    throw failure("Completed fulfilment session " + session.getId()
                            + " has no price or purchaser email");
                }
                processCompleted(session);
                break;
            case EXPIRED:
                FulfilmentSessionTicketWriter.refundVacancy(session);
                break;
            default:
                throw failure("Fulfilment session " + session.getId()
                        + " has unsupported status " + session.getStatus());
        }
    }

    /**
     * Logging and throwing fails the function invocation, so Pub/Sub redelivers until the dead-letter topic.
     */
    private static IllegalStateException failure(String message) {
        return failure(message, null);
    }

    private static IllegalStateException failure(String message, Exception cause) {
        if (cause == null) {
            logger.error(message);
            return new IllegalStateException(message);
        }
        logger.error(message, cause);
        return new IllegalStateException(message, cause);
    }

    private static void processCompleted(FulfilmentSession session) throws Exception {
        String orderId = FulfilmentSessionTicketWriter.createTicketsAndOrder(session);
        if (orderId == null) {
            logger.info("Fulfilment session {} already processed", session.getId());
            return;
        }
        EventData eventData = session.getEventData();
        String purchaserName = session.getPurchaserName() == null ? "" : session.getPurchaserName();
        boolean sent = EmailService.sendPurchaseEmail(
                eventData.getEventId(),
                Boolean.TRUE.equals(eventData.getIsPrivate()) ? "Private" : "Public",
                session.getPurchaserEmail(),
                purchaserName,
                orderId);
        if (!sent) {
            logger.error("Purchase email failed for fulfilment session {}", session.getId());
        }
    }

    static RequestedTickets requestedTickets(FulfilmentSession session) {
        if (session instanceof CheckoutFulfilmentSession checkout) {
            return new RequestedTickets(checkout.getNumTickets(), checkout.getEventTicketTypeId(), checkout.getPrice());
        }
        if (session instanceof BookingApprovalFulfilmentSession booking) {
            return new RequestedTickets(booking.getNumTickets(), booking.getEventTicketTypeId(), booking.getPrice());
        }
        if (session instanceof WaitlistFulfilmentSession waitlist) {
            return new RequestedTickets(waitlist.getNumTickets(), waitlist.getEventTicketTypeId(), waitlist.getPrice());
        }
        return null;
    }

    record RequestedTickets(Integer count, String ticketTypeId, Integer priceCents) {
    }
}
