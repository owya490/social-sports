package com.functions.fulfilment.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import com.functions.events.models.EventData;
import com.functions.events.models.EventMetadata;
import com.functions.events.models.ResolvedEventTicketType;
import com.functions.events.repositories.EventTicketTypeRepository;
import com.functions.events.repositories.EventsRepository;
import com.functions.events.services.EventTicketTypeService;
import com.functions.firebase.services.FirebaseService;
import com.functions.firebase.services.FirebaseService.CollectionPaths;
import com.functions.fulfilment.models.fulfilmentEntities.FormsFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;
import com.functions.fulfilment.services.ProcessFulfilmentSessionService.Purchase;
import com.functions.tickets.models.Order;
import com.functions.tickets.models.OrderAndTicketStatus;
import com.functions.tickets.models.Ticket;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;

/**
 * Mints tickets or refunds vacancy for a fulfilment session carried on the queue.
 * Idempotency is {@code EventMetadata.completedFulfilmentSessionIds}.
 */
class FirestoreProcessFulfilmentSessionStore implements ProcessFulfilmentSessionService.Store {

    @Override
    public String mint(FulfilmentSession session) throws Exception {
        Purchase purchase = ProcessFulfilmentSessionService.purchaseOf(session);
        String eventId = session.getEventData().getEventId();
        return FirebaseService.createFirestoreTransaction(transaction -> {
            Optional<EventData> maybeEvent = EventsRepository.getEventById(eventId, Optional.of(transaction));
            if (maybeEvent.isEmpty()) {
                throw new IllegalStateException("Event not found for fulfilment session " + session.getId());
            }
            EventData event = maybeEvent.get();
            event.setEventId(eventId);

            MetadataDocument metadataDocument = readMetadata(transaction, eventId, event.getOrganiserId());
            if (alreadyProcessed(metadataDocument.metadata(), session.getId())) {
                return null;
            }

            ResolvedEventTicketType ticketType = EventTicketTypeService.resolveById(event, purchase.eventTicketTypeId());
            long unitAmount = purchase.price() == null ? 0L : purchase.price().longValue();
            String orderId = createTicketsAndOrder(transaction, session, eventId, purchase.numTickets(), unitAmount, ticketType);

            EventMetadata metadata = metadataDocument.metadata();
            metadata.setCompleteTicketCount(metadata.getCompleteTicketCount() + purchase.numTickets());
            metadata.getOrderIds().add(orderId);
            metadata.getCompletedFulfilmentSessionIds().add(session.getId());
            transaction.set(metadataDocument.reference(), metadata);
            return orderId;
        });
    }

    @Override
    public void refundVacancy(FulfilmentSession session) throws Exception {
        Purchase purchase = ProcessFulfilmentSessionService.purchaseOf(session);
        String eventId = session.getEventData().getEventId();
        FirebaseService.createFirestoreTransaction(transaction -> {
            DocumentReference eventRef = EventsRepository.getEventDocumentReferenceInTransaction(eventId, transaction);
            Optional<EventData> maybeEvent = EventsRepository.getEventById(eventId, Optional.of(transaction));
            if (maybeEvent.isEmpty()) {
                throw new IllegalStateException("Event not found for fulfilment session " + session.getId());
            }
            EventData event = maybeEvent.get();
            event.setEventId(eventId);

            MetadataDocument metadataDocument = readMetadata(transaction, eventId, event.getOrganiserId());
            if (alreadyProcessed(metadataDocument.metadata(), session.getId())) {
                return null;
            }

            ResolvedEventTicketType ticketType = EventTicketTypeService.resolveById(event, purchase.eventTicketTypeId());
            EventTicketTypeRepository.incrementVacancy(transaction, eventRef, ticketType, purchase.numTickets());
            metadataDocument.metadata().getCompletedFulfilmentSessionIds().add(session.getId());
            transaction.set(metadataDocument.reference(), metadataDocument.metadata());
            return null;
        });
    }

    private static String createTicketsAndOrder(
            Transaction transaction,
            FulfilmentSession session,
            String eventId,
            int quantity,
            long unitAmount,
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
            ticket.setPrice(unitAmount);
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

    private static MetadataDocument readMetadata(Transaction transaction, String eventId, String organiserId)
            throws Exception {
        DocumentReference metadataRef = EventsRepository.getEventMetadataDocumentReference(eventId);
        DocumentSnapshot snapshot = transaction.get(metadataRef).get();
        EventMetadata metadata = snapshot.exists() ? snapshot.toObject(EventMetadata.class) : new EventMetadata();
        if (metadata == null) {
            metadata = new EventMetadata();
        }
        if (metadata.getOrganiserId() == null || metadata.getOrganiserId().isBlank()) {
            metadata.setOrganiserId(organiserId);
        }
        if (metadata.getCompleteTicketCount() == null) {
            metadata.setCompleteTicketCount(0);
        }
        if (metadata.getOrderIds() == null) {
            metadata.setOrderIds(new ArrayList<>());
        }
        if (metadata.getCompletedFulfilmentSessionIds() == null) {
            metadata.setCompletedFulfilmentSessionIds(new ArrayList<>());
        }
        return new MetadataDocument(metadataRef, metadata);
    }

    private static boolean alreadyProcessed(EventMetadata metadata, String sessionId) {
        List<String> completed = metadata.getCompletedFulfilmentSessionIds();
        return completed != null && completed.contains(sessionId);
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

    private record MetadataDocument(DocumentReference reference, EventMetadata metadata) {
    }
}
