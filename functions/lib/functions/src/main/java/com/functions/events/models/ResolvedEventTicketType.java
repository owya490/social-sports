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
    boolean synthesized;
    /**
     * True for General (and legacy/sole-map defaults). Price/capacity/vacancy are taken from
     * top-level event fields and must stay dual-written with them.
     */
    boolean mirrorsTopLevel;
}
