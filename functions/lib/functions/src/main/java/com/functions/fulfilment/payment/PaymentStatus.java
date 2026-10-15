package com.functions.fulfilment.payment;

public enum PaymentStatus {
    PENDING,
    SUCCEEDED,
    EXPIRED;

    public boolean isTerminal() {
        return this != PENDING;
    }
}
