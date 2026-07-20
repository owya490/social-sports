package com.functions.events.models;

import lombok.Data;

/**
 * NOTE: This type should match the EventTicketType interface in
 * {@code frontend/interfaces/EventTicketTypeTypes.ts}
 */
@Data
public class EventTicketType {
    private String id;
    private String name;
    private Integer price;
    private Integer capacity;
    private Integer vacancy;
}
