package com.functions.waitlist.models.requests;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for removing a waitlist entry by email hash.
 * Used for the email unsubscribe / removal link flow (no auth required).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RemoveFromWaitlistByHashRequest {
    private String eventId;
    private String emailHash;
}
