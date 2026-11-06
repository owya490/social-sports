package com.functions.fulfilment.payment;

public enum PaymentStatus {
    PENDING,    // Still awaiting payment.
    SUCCEEDED,  // Payment collected.
    EXPIRED,    // Checkout timed out unpaid.
    CANCELLED;  // Payment refused.

    public boolean isTerminal() {
        return this != PENDING;
    }
}
