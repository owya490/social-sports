package com.functions.alerts.clients;

import java.util.Optional;

public interface AlertClaimStore {
    /** The documents a successful claim charged, so release undoes exactly those. */
    record Claim(String fingerprint, String day) {
    }

    /**
     * A claim when this delivery may page: the fingerprint has not paged recently,
     * no alert paged in the global window, and the daily budget has room.
     * Records the page atomically when it returns a claim.
     */
    Optional<Claim> claim(String fingerprint);

    /** Undoes a successful {@link #claim} after a failed publication. */
    void release(Claim claim);
}
