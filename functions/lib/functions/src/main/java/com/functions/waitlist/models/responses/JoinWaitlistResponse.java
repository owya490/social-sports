package com.functions.waitlist.models.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response payload after joining a waitlist.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JoinWaitlistResponse {
    /**
     * Whether the operation was successful
     */
    private boolean success;

    /**
     * The email hash of the user
     */
    
    private String emailHash;
    /**
     * Human-readable message
     */
    private String message;
}

