package com.functions.events.models;

import lombok.Builder;
import lombok.Value;

/**
 * Immutable snapshot of an event ticket type used for pricing and inventory decisions.
 */
@Value
@Builder
public class ResolvedEventTicketType {
    String id;
    String name;
    Integer price;
    Integer vacancy;
    Integer capacity;
    /** True when inventory is stored on top-level event fields (no eventTicketTypes map). */
    boolean legacy;
}
