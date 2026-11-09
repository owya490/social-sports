package com.functions.alerts.clients;

import java.util.Optional;

public interface ErrorAlertDedupStore {
    record Reservation(String owner, String fingerprint) {
        public Reservation(String owner) {
            this(owner, "");
        }
    }

    /**
     * Empty means this error has already sent its cap, a send for this same
     * error is already in progress, the ten-minute burst limit is spent, or the
     * daily budget is spent. A different error can still reserve inside that
     * burst. Contention does not throw. Infrastructure failures throw.
     */
    Optional<Reservation> reserve(String fingerprint);

    default Optional<Reservation> reserve() {
        return reserve("");
    }

    void complete(Reservation reservation, String fingerprint);

    default void complete(Reservation reservation) {
        complete(reservation, "");
    }

    void release(Reservation reservation);

    /**
     * Cached SMS for this fingerprint while the incident is still active
     * ({@code smsSavedAt} within the 7-day autoClose window). Lookup is
     * read-only; activity advances from {@link #complete}. Sending stops in
     * {@link #reserve(String)} once the incident count is reached.
     */
    Optional<String> smsFor(String fingerprint);

    /**
     * Persist trimmed SMS after a successful publication. Incidents that already
     * have this text and no send count stay quiet. After expiry, overwrites.
     */
    void rememberSms(String fingerprint, String sms);
}
