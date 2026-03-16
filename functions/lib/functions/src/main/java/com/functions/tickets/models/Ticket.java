package com.functions.tickets.models;

import javax.annotation.Nullable;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.functions.utils.JavaUtils;
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
    @JsonSerialize(using = JavaUtils.TimestampSerializer.class)
    @JsonDeserialize(using = JavaUtils.TimestampDeserializer.class)
    private Timestamp purchaseDate;
    private OrderAndTicketStatus status = OrderAndTicketStatus.APPROVED;
    @Nullable
    private String formResponseId; // the absence of this means the ticket was purchased without a form response
    private OrderAndTicketType type = OrderAndTicketType.GENERAL;
}
