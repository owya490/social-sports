package com.functions.fulfilment.payment;

public enum PaymentStatus {
    PENDING,
    SUCCEEDED,
    EXPIRED,
    CANCELLED;

    public boolean isTerminal() {
        return this != PENDING;
    }
}
