package com.functions.alerts.clients;

public interface ErrorAlertDedupStore {
    /**
     * Claims an in-flight slot so a concurrent duplicate is skipped.
     * Does not start the ten-minute sent window; call {@link #markSent} after a successful publish.
     *
     * @return true if this fingerprint is allowed to send an SMS now
     */
    boolean tryClaim(String fingerprint);

    /**
     * Project-wide (per environment) send slot. At most one AI SMS every ten minutes.
     *
     * @return true if a send is allowed now
     */
    default boolean tryClaimGlobal() {
        return true;
    }

    /** Records a successful publish so the ten-minute window applies. */
    default void markSent(String fingerprint) {
    }

    default void markSentGlobal() {
    }
}
