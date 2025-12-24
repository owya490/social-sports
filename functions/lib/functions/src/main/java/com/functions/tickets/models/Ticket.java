package com.functions.tickets.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.google.cloud.Timestamp;

import lombok.Data;

/**
 * Represents a ticket for an event.
 * Matches the TypeScript Ticket interface.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class Ticket {
    private String ticketId;
    private String eventId;
    private String orderId;
    private long price; // in cents
    private Timestamp purchaseDate;
    private OrderAndTicketStatus status = OrderAndTicketStatus.APPROVED;
}
