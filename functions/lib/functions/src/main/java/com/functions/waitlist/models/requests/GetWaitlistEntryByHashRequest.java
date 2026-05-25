package com.functions.waitlist.models.requests;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for fetching a waitlist entry by email hash.
 * Used for the email unsubscribe / removal link flow (no auth required).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GetWaitlistEntryByHashRequest {
    private String eventId;
    private String emailHash;
}
