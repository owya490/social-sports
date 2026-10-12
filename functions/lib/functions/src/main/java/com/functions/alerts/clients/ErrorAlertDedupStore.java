package com.functions.alerts.clients;

import java.util.Optional;

public interface ErrorAlertDedupStore {
    record Reservation(String owner) {
    }

    /** Empty means intentional suppression; active reservations and infrastructure failures throw for redelivery. */
    Optional<Reservation> reserve();

    void complete(Reservation reservation);

    void release(Reservation reservation);
}
