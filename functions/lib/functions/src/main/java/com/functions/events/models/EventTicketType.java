package com.functions.events.models;

import javax.annotation.Nullable;

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
    /** Optional registration form for this ticket type. Falls back to event.formId when unset. */
    @Nullable
    private String formId;
}
