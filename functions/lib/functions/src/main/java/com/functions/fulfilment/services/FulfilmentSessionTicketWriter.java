package com.functions.fulfilment.services;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.functions.events.models.EventData;
import com.functions.events.models.EventMetadata;
import com.functions.events.models.ResolvedEventTicketType;
import com.functions.events.repositories.EventTicketTypeRepository;
import com.functions.events.repositories.EventsRepository;
import com.functions.events.services.EventTicketTypeService;
import com.functions.firebase.services.FirebaseService;
import com.functions.forms.models.FormResponse;
import com.functions.forms.repositories.FormsRepository;
import com.functions.forms.services.FormsUtils;
import com.functions.fulfilment.models.fulfilmentEntities.FormsFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntityType;
import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;
import com.functions.fulfilment.repositories.FulfilmentSessionRepository;
import com.functions.fulfilment.services.ProcessFulfilmentSessionService.RequestedTickets;
import com.functions.stripe.services.EventTicketPurchaseService;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.SetOptions;
import com.google.cloud.firestore.Transaction;

/**
 * Saves the result of a queued fulfilment session.
 * Completed sessions become tickets and an order. Expired sessions put that many tickets back on sale.
 */
class FulfilmentSessionTicketWriter {

    private FulfilmentSessionTicketWriter() {
    }

    static String createTicketsAndOrder(FulfilmentSession session) throws Exception {
        return FirebaseService.createFirestoreTransaction(transaction -> mintAndComplete(session, transaction));
    }

    static void refundVacancy(FulfilmentSession session) throws Exception {
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
            recordSessionOnEvent(transaction, eventId, session.getId());
            return null;
        });
    }

    /**
     * One completed queue message inside a single transaction. Idempotency is read first: a retry
     * after commit finds the session recorded and the fulfilment session already deleted, so it must
     * not read forms or write again. Temp forms are read next. Mint then reads the event and writes
     * tickets, the order, and event metadata. Form copies, temp deletes, and the session delete are
     * the remaining writes.
     */
    private static String mintAndComplete(FulfilmentSession session, Transaction transaction) throws Exception {
        RequestedTickets tickets = ProcessFulfilmentSessionService.requestedTickets(session);
        String eventId = session.getEventData().getEventId();
        if (sessionAlreadyRecorded(transaction, eventId, session.getId())) {
            return null;
        }
        if (endEntityId(session) == null) {
            throw new IllegalStateException("Fulfilment session " + session.getId() + " has no END entity");
        }

        Map<String, FormResponse> tempFormResponses = readTempForms(session, transaction);
        EventTicketPurchaseService.MintedPurchase minted =
                EventTicketPurchaseService.fulfillCompletedEventTicketPurchase(
                        transaction,
                        eventId,
                        Boolean.TRUE.equals(session.getEventData().getIsPrivate()),
                        tickets.count(),
                        tickets.priceCents().longValue(),
                        tickets.ticketTypeId(),
                        session.getPurchaserEmail(),
                        session.getPurchaserName(),
                        session.getId(),
                        null,
                        null,
                        null,
                        null,
                        null);
        if (minted == null) {
            throw new IllegalStateException(
                    "Fulfillment of event ticket purchase was unsuccessful. session=" + session.getId());
        }
        prepareCompletedSessionMetadata(minted.eventMetadata(), session.getId());
        transaction.set(minted.eventMetadataRef(), minted.eventMetadata());
        writeFormsAndDeleteSession(session, tempFormResponses, transaction);
        return minted.orderId();
    }

    static void prepareCompletedSessionMetadata(EventMetadata metadata, String sessionId) {
        if (metadata.getCompletedFulfilmentSessionIds() == null) {
            metadata.setCompletedFulfilmentSessionIds(new ArrayList<>());
        }
        List<String> sessionIds = metadata.getCompletedFulfilmentSessionIds();
        if (!sessionIds.contains(sessionId)) {
            sessionIds.add(sessionId);
        }
    }

    static String endEntityId(FulfilmentSession session) {
        Map<String, FulfilmentEntity> entityMap = session.getFulfilmentEntityMap();
        List<String> entityIds = session.getFulfilmentEntityIds();
        if (entityIds != null && entityMap != null) {
            for (String entityId : entityIds) {
                FulfilmentEntity entity = entityMap.get(entityId);
                if (entity != null && entity.getType() == FulfilmentEntityType.END) {
                    return entityId;
                }
            }
        }
        if (entityMap != null) {
            for (Map.Entry<String, FulfilmentEntity> entry : entityMap.entrySet()) {
                if (entry.getValue() != null && entry.getValue().getType() == FulfilmentEntityType.END) {
                    return entry.getKey();
                }
            }
        }
        return null;
    }

    private static Map<String, FormResponse> readTempForms(FulfilmentSession session, Transaction transaction)
            throws Exception {
        Map<String, FormResponse> tempFormResponses = new HashMap<>();
        List<String> entityIds = session.getFulfilmentEntityIds();
        if (entityIds == null || session.getFulfilmentEntityMap() == null) {
            return tempFormResponses;
        }
        for (String entityId : entityIds) {
            FulfilmentEntity entity = session.getFulfilmentEntityMap().get(entityId);
            if (entity == null || entity.getType() != FulfilmentEntityType.FORMS) {
                continue;
            }
            FormsFulfilmentEntity formsEntity = (FormsFulfilmentEntity) entity;
            FormResponse tempFormResponse = FormsRepository.getTempFormResponseById(
                    formsEntity.getFormId(),
                    formsEntity.getEventId(),
                    formsEntity.getFormResponseId(),
                    Optional.of(transaction));
            if (tempFormResponse == null) {
                throw new IllegalStateException(
                        "Temporary form response not found for fulfilment session " + session.getId());
            }
            tempFormResponses.put(formKey(formsEntity), tempFormResponse);
        }
        return tempFormResponses;
    }

    private static void writeFormsAndDeleteSession(
            FulfilmentSession session,
            Map<String, FormResponse> tempFormResponses,
            Transaction transaction) throws Exception {
        List<String> entityIds = session.getFulfilmentEntityIds();
        if (entityIds != null && session.getFulfilmentEntityMap() != null) {
            for (String entityId : entityIds) {
                FulfilmentEntity entity = session.getFulfilmentEntityMap().get(entityId);
                if (entity == null || entity.getType() != FulfilmentEntityType.FORMS) {
                    continue;
                }
                FormsFulfilmentEntity formsEntity = (FormsFulfilmentEntity) entity;
                FormResponse tempFormResponse = tempFormResponses.get(formKey(formsEntity));
                if (tempFormResponse == null) {
                    throw new IllegalStateException(
                            "Pre-read form response not found for fulfilment session " + session.getId());
                }
                FormsUtils.copyTempFormResponseToSubmittedWithData(tempFormResponse, Optional.of(transaction));
            }
        }
        FulfilmentSessionRepository.deleteFulfilmentSession(session.getId(), Optional.of(transaction));
    }

    private static String formKey(FormsFulfilmentEntity formsEntity) {
        return formsEntity.getFormId() + ":" + formsEntity.getEventId() + ":" + formsEntity.getFormResponseId();
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

    private static void recordSessionOnEvent(Transaction transaction, String eventId, String sessionId) {
        Map<String, Object> updates = new HashMap<>();
        updates.put("completedFulfilmentSessionIds", FieldValue.arrayUnion(sessionId));
        transaction.set(EventsRepository.getEventMetadataDocumentReference(eventId), updates, SetOptions.merge());
    }
}
