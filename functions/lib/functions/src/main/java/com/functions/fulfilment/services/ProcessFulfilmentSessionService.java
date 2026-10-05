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

    private final TicketWriter ticketWriter;
    private final PurchaseEmailSender purchaseEmailSender;

    public ProcessFulfilmentSessionService() {
        this(new FulfilmentSessionTicketWriter(), EmailService::sendPurchaseEmail);
    }

    ProcessFulfilmentSessionService(TicketWriter ticketWriter, PurchaseEmailSender purchaseEmailSender) {
        this.ticketWriter = ticketWriter;
        this.purchaseEmailSender = purchaseEmailSender;
    }

    public void process(String sessionJson) throws Exception {
        FulfilmentSession session;
        try {
            session = FulfilmentSession.fromJson(sessionJson);
        } catch (Exception e) {
            logger.warn("Ignoring malformed fulfilment session message: {}", e.getMessage());
            return;
        }
        if (session.getStatus() == null) {
            String sessionId = session.getId() == null || session.getId().isBlank() ? "unknown" : session.getId();
            logger.error("Fulfilment session {} has no status", sessionId);
            return;
        }
        if (session.getId() == null || session.getId().isBlank()) {
            logger.warn("Ignoring fulfilment session message without id");
            return;
        }
        if (session.getEventData() == null
                || session.getEventData().getEventId() == null
                || session.getEventData().getEventId().isBlank()) {
            logger.warn("Ignoring fulfilment session {} without an event", session.getId());
            return;
        }
        RequestedTickets tickets = requestedTickets(session);
        if (tickets == null
                || tickets.count() == null
                || tickets.count() <= 0
                || tickets.ticketTypeId() == null
                || tickets.ticketTypeId().isBlank()) {
            logger.warn("Ignoring fulfilment session {} without ticket quantity or ticket type", session.getId());
            return;
        }

        switch (session.getStatus()) {
            case COMPLETED:
                if (tickets.priceCents() == null
                        || session.getPurchaserEmail() == null
                        || session.getPurchaserEmail().isBlank()) {
                    logger.warn("Ignoring completed fulfilment session {} without price or purchaser email",
                            session.getId());
                    return;
                }
                processCompleted(session);
                break;
            case EXPIRED:
                ticketWriter.refundVacancy(session);
                break;
        }
    }

    private void processCompleted(FulfilmentSession session) throws Exception {
        String orderId = ticketWriter.createTicketsAndOrder(session);
        if (orderId == null) {
            logger.info("Fulfilment session {} already processed", session.getId());
            return;
        }
        EventData eventData = session.getEventData();
        String purchaserName = session.getPurchaserName() == null ? "" : session.getPurchaserName();
        boolean sent = purchaseEmailSender.send(
                eventData.getEventId(),
                Boolean.TRUE.equals(eventData.getIsPrivate()) ? "Private" : "Public",
                session.getPurchaserEmail(),
                purchaserName,
                orderId);
        if (!sent) {
            logger.warn("Purchase email failed for fulfilment session {}", session.getId());
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

    interface TicketWriter {
        /**
         * @return the new order id, or null when this session was already recorded on the event
         */
        String createTicketsAndOrder(FulfilmentSession session) throws Exception;

        void refundVacancy(FulfilmentSession session) throws Exception;
    }

    @FunctionalInterface
    interface PurchaseEmailSender {
        boolean send(String eventId, String visibility, String email, String firstName, String orderId);
    }
}
