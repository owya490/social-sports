package com.functions.waitlist.models.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response payload for a waitlist entry lookup by email hash.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GetWaitlistEntryByHashResponse {
    private boolean found;
    private String name;
    private String email;
    private int ticketCount;
}
