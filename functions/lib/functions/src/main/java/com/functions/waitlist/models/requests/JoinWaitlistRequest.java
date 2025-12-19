package com.functions.waitlist.models.requests;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for joining a waitlist.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JoinWaitlistRequest {
    /**
     * The event ID to join waitlist for
     */
    private String eventId;

    /**
     * User's display name
     */
    private String name;

    /**
     * User's email address
     */
    private String email;

    /**
     * Number of tickets requested
     */
    private int ticketCount;
}

