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
 * Post-payment fulfilment for a session already present on the Pub/Sub message.
 */
public class ProcessFulfilmentSessionService {
    private static final Logger logger = LoggerFactory.getLogger(ProcessFulfilmentSessionService.class);

    private final Store store;
    private final PurchaseEmailSender purchaseEmailSender;

    public ProcessFulfilmentSessionService() {
        this(new FirestoreProcessFulfilmentSessionStore(), EmailService::sendPurchaseEmail);
    }

    ProcessFulfilmentSessionService(Store store, PurchaseEmailSender purchaseEmailSender) {
        this.store = store;
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
        if (session.getId() == null || session.getId().isBlank() || session.getStatus() == null) {
            logger.warn("Ignoring fulfilment session message without id or status");
            return;
        }
        if (session.getEventData() == null
                || session.getEventData().getEventId() == null
                || session.getEventData().getEventId().isBlank()) {
            logger.warn("Ignoring fulfilment session {} without an event", session.getId());
            return;
        }
        Purchase purchase = purchaseOf(session);
        if (purchase == null
                || purchase.numTickets() == null
                || purchase.numTickets() <= 0
                || purchase.eventTicketTypeId() == null
                || purchase.eventTicketTypeId().isBlank()) {
            logger.warn("Ignoring fulfilment session {} without ticket quantity or ticket type", session.getId());
            return;
        }

        switch (session.getStatus()) {
            case COMPLETED:
                if (purchase.price() == null
                        || session.getPurchaserEmail() == null
                        || session.getPurchaserEmail().isBlank()) {
                    logger.warn("Ignoring completed fulfilment session {} without price or purchaser email",
                            session.getId());
                    return;
                }
                processCompleted(session);
                break;
            case EXPIRED:
                store.refundVacancy(session);
                break;
        }
    }

    private void processCompleted(FulfilmentSession session) throws Exception {
        String orderId = store.mint(session);
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

    static Purchase purchaseOf(FulfilmentSession session) {
        if (session instanceof CheckoutFulfilmentSession checkout) {
            return new Purchase(checkout.getNumTickets(), checkout.getEventTicketTypeId(), checkout.getPrice());
        }
        if (session instanceof BookingApprovalFulfilmentSession booking) {
            return new Purchase(booking.getNumTickets(), booking.getEventTicketTypeId(), booking.getPrice());
        }
        if (session instanceof WaitlistFulfilmentSession waitlist) {
            return new Purchase(waitlist.getNumTickets(), waitlist.getEventTicketTypeId(), waitlist.getPrice());
        }
        return null;
    }

    record Purchase(Integer numTickets, String eventTicketTypeId, Integer price) {
    }

    interface Store {
        /**
         * @return the new order id, or null when this session was already fulfilled
         */
        String mint(FulfilmentSession session) throws Exception;

        void refundVacancy(FulfilmentSession session) throws Exception;
    }

    @FunctionalInterface
    interface PurchaseEmailSender {
        boolean send(String eventId, String visibility, String email, String firstName, String orderId);
    }
}
