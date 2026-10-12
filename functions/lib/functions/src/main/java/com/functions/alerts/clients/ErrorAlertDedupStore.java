package com.functions.alerts.clients;

import java.util.Optional;

public interface ErrorAlertDedupStore {
    record Reservation(String owner) {
    }

    /** Empty means cooldown, budget, or another delivery already in flight. Infrastructure failures throw. */
    Optional<Reservation> reserve();

    void complete(Reservation reservation);

    void release(Reservation reservation);
}
