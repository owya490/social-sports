package com.functions.stripe.exceptions;

/**
 * Exception thrown when a checkout cannot be created due to date/time constraints.
 * This exception should be handled by returning an error url to the caller.
 */
public class CheckoutDateTimeException extends RuntimeException {

    public CheckoutDateTimeException(String message) {
        super(message);
    }

    public CheckoutDateTimeException(String message, Throwable cause) {
        super(message, cause);
    }
    
}

