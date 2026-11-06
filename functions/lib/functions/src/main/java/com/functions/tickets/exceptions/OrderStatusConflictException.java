package com.functions.tickets.exceptions;

/**
 * Thrown when an order has already reached a terminal status that conflicts with the requested operation.
 */
public class OrderStatusConflictException extends RuntimeException {
    public OrderStatusConflictException(String message) {
        super(message);
    }
}
