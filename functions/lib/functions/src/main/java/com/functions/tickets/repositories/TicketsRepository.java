package com.functions.tickets.repositories;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.firebase.services.FirebaseService;
import com.functions.tickets.models.Ticket;
import com.functions.utils.JavaUtils;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.Transaction;

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
        return getTicketById(ticketId, Optional.empty());
    }

    public static Optional<Ticket> getTicketById(String ticketId, Optional<Transaction> transaction) {
        try {
            Firestore db = FirebaseService.getFirestore();
            DocumentReference docRef = db.collection(TICKETS_COLLECTION).document(ticketId);
            DocumentSnapshot snapshot = transaction.isPresent() ? transaction.get().get(docRef).get()
                    : docRef.get().get();

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
     * Gets multiple tickets by their IDs.
     *
     * @param ticketIds List of ticket IDs
     * @return List of tickets found
     */

    public static List<Ticket> getTicketsByIds(List<String> ticketIds) {
        return getTicketsByIds(ticketIds, Optional.empty());
    }

    public static List<Ticket> getTicketsByIds(List<String> ticketIds, Optional<Transaction> transaction) {
        List<Ticket> tickets = new ArrayList<>();
        for (String ticketId : ticketIds) {
            getTicketById(ticketId, transaction).ifPresent(tickets::add);
        }
        return tickets;
    }

    public static void updateTicket(String ticketId, Ticket ticket) {
        updateTicket(ticketId, ticket, Optional.empty());
    }

    public static void updateTicket(String ticketId, Ticket ticket, Optional<Transaction> transaction) {
        try {
            Firestore db = FirebaseService.getFirestore();
            DocumentReference docRef = db.collection(TICKETS_COLLECTION).document(ticketId);
            if (transaction.isPresent()) {
                transaction.get().update(docRef, JavaUtils.toMap(ticket));
            } else {
                docRef.update(JavaUtils.toMap(ticket)).get();
            }
        } catch (Exception e) {
            logger.error("Failed to update ticket: {}", ticketId, e);
            throw new RuntimeException("Failed to update ticket", e);
        }
    }

    /**
     * Creates a new ticket document in Firestore.
     *
     * @param ticket      The ticket to create (ticketId will be set from the new
     *                    document)
     * @param transaction The Firestore transaction
     * @return The generated ticket ID
     */
    public static String createTicket(Ticket ticket, Transaction transaction) {
        Firestore db = FirebaseService.getFirestore();
        DocumentReference docRef = db.collection(TICKETS_COLLECTION).document();
        String ticketId = docRef.getId();
        ticket.setTicketId(ticketId);
        transaction.set(docRef, JavaUtils.toMap(ticket));
        return ticketId;
    }

    /**
     * Gets all tickets for a given event ID.
     *
     * @param eventId The event ID
     * @return List of tickets belonging to the event
     */
    public static List<Ticket> getTicketsByEventId(String eventId) {
        try {
            Firestore db = FirebaseService.getFirestore();
            List<QueryDocumentSnapshot> docs = db.collection(TICKETS_COLLECTION)
                    .whereEqualTo("eventId", eventId)
                    .get().get().getDocuments();

            return docs.stream().map(doc -> {
                Ticket ticket = doc.toObject(Ticket.class);
                ticket.setTicketId(doc.getId());
                return ticket;
            }).collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Failed to get tickets by eventId: {}", eventId, e);
            return new ArrayList<>();
        }
    }
}
