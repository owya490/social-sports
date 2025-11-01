package com.functions.events.models;

import lombok.Data;

/**
 * NOTE: This type should match the TicketTypeData interface in `frontend/interfaces/TicketTypeTypes.ts`
 */
@Data
public class TicketTypeData {
    private String id;
    private String name;
    private Integer price; // in cents
    private Integer availableQuantity;
    private Integer soldQuantity;
} 