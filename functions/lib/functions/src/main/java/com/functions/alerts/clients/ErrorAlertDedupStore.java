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
     * Stable SMS for this fingerprint while the incident is still active
     * ({@code smsSavedAt} within the 7-day autoClose window). Lookup is read-only;
     * activity advances from {@link #complete}. Empty means generate and persist a
     * new interpretation.
     */
    Optional<String> smsFor(String fingerprint);

    /**
     * Persist trimmed SMS for this fingerprint. Reuses the stored value while the
     * incident window is open so EXTRACT(sms) identity stays stable. After expiry,
     * overwrites with the new Gemini wording.
     */
    void rememberSms(String fingerprint, String sms);
}
