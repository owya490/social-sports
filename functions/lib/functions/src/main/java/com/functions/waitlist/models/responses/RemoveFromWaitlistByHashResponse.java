package com.functions.waitlist.models.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response payload for removing a waitlist entry by email hash.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RemoveFromWaitlistByHashResponse {
    private boolean success;
    private String message;
}
