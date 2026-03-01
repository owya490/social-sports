package com.functions.stripe.models;

import com.google.cloud.Timestamp;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a ticket for an event.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {
    private String eventId;
    private String orderId;
    private Long price;
    private Timestamp purchaseDate;
}

