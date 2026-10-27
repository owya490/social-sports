package com.functions.alerts.clients;

import java.util.Optional;

public interface ErrorAlertDedupStore {
    record Reservation(String owner) {
    }

    /**
     * Empty means cooldown or daily budget. Another in-progress delivery throws
     * so Pub/Sub can redeliver. Infrastructure failures throw.
     */
    Optional<Reservation> reserve();

    void complete(Reservation reservation, String fingerprint);

    default void complete(Reservation reservation) {
        complete(reservation, "");
    }

    void release(Reservation reservation);

    /**
     * Cached SMS for this fingerprint while the incident is still active
     * ({@code smsSavedAt} within the 7-day autoClose window). Present means this
     * error was already paged; do not reserve, interpret, or publish again.
     * Lookup is read-only; activity advances from {@link #complete}.
     */
    Optional<String> smsFor(String fingerprint);

    /**
     * Persist trimmed SMS for this fingerprint before the first successful
     * publication. After expiry, overwrites with the new Gemini wording.
     */
    void rememberSms(String fingerprint, String sms);
}
