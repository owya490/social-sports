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

    void complete(Reservation reservation);

    void release(Reservation reservation);

    /** Stable SMS already published for this fingerprint, if any. */
    Optional<String> smsFor(String fingerprint);

    /**
     * Persist trimmed SMS on first successful Gemini for this fingerprint.
     * Later calls keep the stored value so EXTRACT(sms) identity stays stable.
     */
    void rememberSms(String fingerprint, String sms);
}
