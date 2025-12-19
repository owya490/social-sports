package com.functions.waitlist.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Individual waitlist entry for a user.
 * Stored in Firestore as: Waitlist/{eventId}/WaitlistPool/{emailHash}
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WaitlistEntry {
    /**
     * User's display name
     */
    private String name;

    /**
     * User's email address
     */
    private String email;

    /**
     * Unix timestamp of when we last notified this user.
     * Null if never notified. Used to prevent spam notifications.
     */
    private Long notifiedAt;

    /**
     * Number of tickets the user wants
     */
    private int ticketCount;
}

