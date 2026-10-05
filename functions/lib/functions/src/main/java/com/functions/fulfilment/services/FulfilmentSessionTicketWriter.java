package com.functions.fulfilment.services;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.functions.events.models.EventData;
import com.functions.events.models.ResolvedEventTicketType;
import com.functions.events.repositories.EventTicketTypeRepository;
import com.functions.events.repositories.EventsRepository;
import com.functions.events.services.EventTicketTypeService;
import com.functions.firebase.services.FirebaseService;
import com.functions.firebase.services.FirebaseService.CollectionPaths;
import com.functions.fulfilment.models.fulfilmentEntities.FormsFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;
import com.functions.fulfilment.services.ProcessFulfilmentSessionService.RequestedTickets;
import com.functions.tickets.models.Order;
import com.functions.tickets.models.OrderAndTicketStatus;
import com.functions.tickets.models.Ticket;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.SetOptions;
import com.google.cloud.firestore.Transaction;

/**
 * Saves the result of a queued fulfilment session.
 * Completed sessions become tickets and an order. Expired sessions put that many tickets back on sale.
 */
class FulfilmentSessionTicketWriter implements ProcessFulfilmentSessionService.TicketWriter {

    @Override
    public String createTicketsAndOrder(FulfilmentSession session) throws Exception {
        RequestedTickets tickets = ProcessFulfilmentSessionService.requestedTickets(session);
        String eventId = session.getEventData().getEventId();
        return FirebaseService.createFirestoreTransaction(transaction -> {
            EventData event = requireEvent(transaction, eventId);
            if (sessionAlreadyRecorded(transaction, eventId, session.getId())) {
                return null;
            }

            ResolvedEventTicketType ticketType = EventTicketTypeService.resolveById(event, tickets.ticketTypeId());
            String orderId = writeTicketsAndOrder(
                    transaction, session, eventId, tickets.count(), tickets.priceCents().longValue(), ticketType);
            recordSessionOnEvent(transaction, eventId, session.getId(), orderId, tickets.count());
            return orderId;
        });
    }

    @Override
    public void refundVacancy(FulfilmentSession session) throws Exception {
        RequestedTickets tickets = ProcessFulfilmentSessionService.requestedTickets(session);
        String eventId = session.getEventData().getEventId();
        FirebaseService.createFirestoreTransaction(transaction -> {
            DocumentReference eventRef = EventsRepository.getEventDocumentReferenceInTransaction(eventId, transaction);
            EventData event = requireEvent(transaction, eventId);
            if (sessionAlreadyRecorded(transaction, eventId, session.getId())) {
                return null;
            }

            ResolvedEventTicketType ticketType = EventTicketTypeService.resolveById(event, tickets.ticketTypeId());
            EventTicketTypeRepository.incrementVacancy(transaction, eventRef, ticketType, tickets.count());
            recordSessionOnEvent(transaction, eventId, session.getId(), null, 0);
            return null;
        });
    }

    private static EventData requireEvent(Transaction transaction, String eventId) throws Exception {
        Optional<EventData> maybeEvent = EventsRepository.getEventById(eventId, Optional.of(transaction));
        if (maybeEvent.isEmpty()) {
            throw new IllegalStateException("Event not found: " + eventId);
        }
        EventData event = maybeEvent.get();
        event.setEventId(eventId);
        return event;
    }

    private static boolean sessionAlreadyRecorded(Transaction transaction, String eventId, String sessionId)
            throws Exception {
        DocumentSnapshot snapshot = transaction.get(EventsRepository.getEventMetadataDocumentReference(eventId)).get();
        Object completed = snapshot.get("completedFulfilmentSessionIds");
        return completed instanceof List<?> ids && ids.contains(sessionId);
    }

    private static void recordSessionOnEvent(
            Transaction transaction, String eventId, String sessionId, String orderId, int quantity) {
        Map<String, Object> updates = new HashMap<>();
        updates.put("completedFulfilmentSessionIds", FieldValue.arrayUnion(sessionId));
        if (orderId != null) {
            updates.put("orderIds", FieldValue.arrayUnion(orderId));
            updates.put("completeTicketCount", FieldValue.increment(quantity));
        }
        transaction.set(EventsRepository.getEventMetadataDocumentReference(eventId), updates, SetOptions.merge());
    }

    private static String writeTicketsAndOrder(
            Transaction transaction,
            FulfilmentSession session,
            String eventId,
            int quantity,
            long priceCents,
            ResolvedEventTicketType ticketType) {
        Firestore db = FirebaseService.getFirestore();
        DocumentReference orderRef = db.collection(CollectionPaths.ORDERS).document();
        List<String> formResponseIds = formResponseIds(session);
        Timestamp purchaseTime = Timestamp.now();
        List<String> ticketIds = new ArrayList<>();

        for (int i = 0; i < quantity; i++) {
            DocumentReference ticketRef = db.collection(CollectionPaths.TICKETS).document();
            Ticket ticket = new Ticket();
            ticket.setEventId(eventId);
            ticket.setOrderId(orderRef.getId());
            ticket.setPrice(priceCents);
            ticket.setPurchaseDate(purchaseTime);
            ticket.setStatus(OrderAndTicketStatus.APPROVED);
            if (i < formResponseIds.size()) {
                ticket.setFormResponseId(formResponseIds.get(i));
            }
            EventTicketTypeService.stampTicket(ticket, ticketType);
            transaction.create(ticketRef, ticket);
            ticketIds.add(ticketRef.getId());
        }

        Order order = new Order();
        order.setOrderId(orderRef.getId());
        order.setDatePurchased(purchaseTime);
        order.setEmail(session.getPurchaserEmail());
        order.setFullName(session.getPurchaserName());
        order.setTickets(ticketIds);
        order.setStatus(OrderAndTicketStatus.APPROVED);
        transaction.set(orderRef, order);
        return orderRef.getId();
    }

    private static List<String> formResponseIds(FulfilmentSession session) {
        List<String> formResponseIds = new ArrayList<>();
        if (session.getFulfilmentEntityIds() == null || session.getFulfilmentEntityMap() == null) {
            return formResponseIds;
        }
        for (String entityId : session.getFulfilmentEntityIds()) {
            FulfilmentEntity entity = session.getFulfilmentEntityMap().get(entityId);
            if (entity instanceof FormsFulfilmentEntity forms
                    && forms.getFormResponseId() != null
                    && !forms.getFormResponseId().isBlank()) {
                formResponseIds.add(forms.getFormResponseId());
            }
        }
        return formResponseIds;
    }
}
