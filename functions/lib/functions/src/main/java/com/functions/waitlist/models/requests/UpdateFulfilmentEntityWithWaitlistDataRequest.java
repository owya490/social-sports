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
public class UpdateFulfilmentEntityWithWaitlistDataRequest {
    /**
     * The fulfilment session ID to update
     */
    private String fulfilmentSessionId;

    /**
     * The fulfilment entity ID to update
     */
    private String fulfilmentEntityId;

    /**
     * User's display name
     */
    private String name;

    /**
     * User's email address
     */
    private String email;
}

