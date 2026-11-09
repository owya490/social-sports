package com.functions.alerts.clients;

public interface AlertClaimStore {
    /**
     * True when this delivery may page: the fingerprint has not paged recently,
     * no alert paged in the global window, and the daily budget has room.
     * Records the page atomically when it returns true.
     */
    boolean claim(String fingerprint);

    /** Undoes a successful {@link #claim} after a failed publication. */
    void release(String fingerprint);
}
