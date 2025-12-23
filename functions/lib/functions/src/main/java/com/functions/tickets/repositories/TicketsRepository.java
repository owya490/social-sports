package com.functions.tickets.repositories;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.firebase.services.FirebaseService;
import com.functions.tickets.models.Ticket;
import com.functions.utils.JavaUtils;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;

/**
 * Repository for accessing ticket data from Firestore.
 */
public class TicketsRepository {
    private static final Logger logger = LoggerFactory.getLogger(TicketsRepository.class);
    private static final String TICKETS_COLLECTION = "Tickets";

    /**
     * Gets a ticket by its ID.
     *
     * @param ticketId The ticket ID
     * @return Optional containing the ticket if found
     */
    public static Optional<Ticket> getTicketById(String ticketId) {
        try {
            Firestore db = FirebaseService.getFirestore();
            DocumentReference docRef = db.collection(TICKETS_COLLECTION).document(ticketId);
            DocumentSnapshot snapshot = docRef.get().get();

            if (snapshot.exists()) {
                Ticket ticket = snapshot.toObject(Ticket.class);
                if (ticket != null) {
                    ticket.setTicketId(ticketId);
                }
                return Optional.ofNullable(ticket);
            }
            return Optional.empty();
        } catch (Exception e) {
            logger.error("Failed to get ticket by ID: {}", ticketId, e);
            return Optional.empty();
        }
    }

    /**
     * Gets all tickets for a specific order.
     *
     * @param orderId The order ID
     * @return List of tickets for the order
     */
    public static List<Ticket> getTicketsByOrderId(String orderId) {
        try {
            Firestore db = FirebaseService.getFirestore();
            Query query = db.collection(TICKETS_COLLECTION).whereEqualTo("orderId", orderId);
            QuerySnapshot snapshots = query.get().get();

            List<Ticket> tickets = new ArrayList<>();
            for (QueryDocumentSnapshot doc : snapshots.getDocuments()) {
                Ticket ticket = doc.toObject(Ticket.class);
                ticket.setTicketId(doc.getId());
                tickets.add(ticket);
            }
            return tickets;
        } catch (Exception e) {
            logger.error("Failed to get tickets by order ID: {}", orderId, e);
            return new ArrayList<>();
        }
    }

    /**
     * Gets all tickets for a specific event.
     *
     * @param eventId The event ID
     * @return List of tickets for the event
     */
    public static List<Ticket> getTicketsByEventId(String eventId) {
        try {
            Firestore db = FirebaseService.getFirestore();
            Query query = db.collection(TICKETS_COLLECTION).whereEqualTo("eventId", eventId);
            QuerySnapshot snapshots = query.get().get();

            List<Ticket> tickets = new ArrayList<>();
            for (QueryDocumentSnapshot doc : snapshots.getDocuments()) {
                Ticket ticket = doc.toObject(Ticket.class);
                ticket.setTicketId(doc.getId());
                tickets.add(ticket);
            }
            return tickets;
        } catch (Exception e) {
            logger.error("Failed to get tickets by event ID: {}", eventId, e);
            return new ArrayList<>();
        }
    }

    /**
     * Gets multiple tickets by their IDs.
     *
     * @param ticketIds List of ticket IDs
     * @return List of tickets found
     */
    public static List<Ticket> getTicketsByIds(List<String> ticketIds) {
        List<Ticket> tickets = new ArrayList<>();
        for (String ticketId : ticketIds) {
            getTicketById(ticketId).ifPresent(tickets::add);
        }
        return tickets;
    }

    public static boolean updateTicket(String ticketId, Ticket ticket) {
        try {
            Firestore db = FirebaseService.getFirestore();
            db.collection(TICKETS_COLLECTION).document(ticketId).update(JavaUtils.toMap(ticket));
            return true;
        } catch (Exception e) {
            logger.error("Failed to update ticket: {}", ticketId, e);
            return false;
        }
    }
}
