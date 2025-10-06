package com.functions.events.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a ticket type for an event.
 * This should match the TicketTypeData interface in
 * frontend/interfaces/TicketTypes.ts
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketType {
    private String id;
    private String name;
    private Integer price;
    private Integer availableQuantity;
    private Integer soldQuantity;
}
