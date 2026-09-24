package com.functions.alerts.clients;

public interface ErrorAlertDedupStore {
    /**
     * @return true if this fingerprint is allowed to send an SMS now
     */
    boolean tryClaim(String fingerprint);
}
