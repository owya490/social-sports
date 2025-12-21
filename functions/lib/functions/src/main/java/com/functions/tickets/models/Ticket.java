package com.functions.tickets.models;

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
}

