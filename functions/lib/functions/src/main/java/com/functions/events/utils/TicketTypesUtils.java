package com.functions.events.utils;

import com.functions.events.models.TicketType;
import com.functions.utils.JavaUtils;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Transaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;

/**
 * Utility class for creating and managing ticket types
 */
public class TicketTypesUtils {
    private static final Logger logger = LoggerFactory.getLogger(TicketTypesUtils.class);

    // Ticket Type IDs matching frontend constants
    public static final String TICKET_TYPE_ID_ADMIN = "Admin";
    public static final String TICKET_TYPE_ID_GENERAL = "General";

    // Subcollection name
    private static final String TICKET_TYPES_COLLECTION = "TicketTypes";

    /**
     * Create default ticket types for a new event within a transaction.
     * Creates:
     * - Admin ticket: Unlimited quantity, free
     * - General ticket: Event capacity quantity, event price
     *
     * @param transaction Firestore transaction
     * @param eventDocRef Reference to the event document
     * @param capacity    Event capacity
     * @param price       Event price in cents
     * @throws Exception if creation fails
     */
    public static void createDefaultTicketTypes(Transaction transaction, DocumentReference eventDocRef,
            Integer capacity, Integer price) throws Exception {
        logger.info("Creating default ticket types for event: {}", eventDocRef.getId());

        try {
            List<TicketType> defaultTicketTypes = getDefaultTicketTypes(capacity, price);

            for (TicketType ticketType : defaultTicketTypes) {
                DocumentReference ticketTypeDocRef = eventDocRef
                        .collection(TICKET_TYPES_COLLECTION)
                        .document(ticketType.getId());

                transaction.set(ticketTypeDocRef, JavaUtils.toMap(ticketType));
                logger.info("Added ticket type '{}' to event '{}'", ticketType.getName(), eventDocRef.getId());
            }
        } catch (Exception e) {
            logger.error("Failed to create ticket types for event {}: {}", eventDocRef.getId(), e.getMessage());
            throw e;
        }
    }

    /**
     * Get the default ticket types for a new event
     *
     * @param capacity Event capacity
     * @param price    Event price in cents
     * @return List of default ticket types
     */
    private static List<TicketType> getDefaultTicketTypes(Integer capacity, Integer price) {
        List<TicketType> ticketTypes = new ArrayList<>();

        // Admin ticket - unlimited quantity, free
        ticketTypes.add(TicketType.builder()
                .id(TICKET_TYPE_ID_ADMIN)
                .name("Admin")
                .price(0)
                .availableQuantity(Integer.MAX_VALUE)
                .soldQuantity(0)
                .build());

        // General ticket - event capacity, event price
        ticketTypes.add(TicketType.builder()
                .id(TICKET_TYPE_ID_GENERAL)
                .name("General")
                .price(price)
                .availableQuantity(capacity)
                .soldQuantity(0)
                .build());

        return ticketTypes;
    }
}
