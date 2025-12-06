package com.functions.stripe.exceptions;

/**
 * Exception thrown when a checkout cannot be created due to vacancy constraints.
 */
public class CheckoutVacancyException extends RuntimeException {

    public CheckoutVacancyException(String message) {
        super(message);
    }

    public CheckoutVacancyException(String message, Throwable cause) {
        super(message, cause);
    }
    
}
