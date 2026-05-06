package com.functions.fulfilment.exceptions;

/**
 * Exception thrown when fulfilment progression is blocked because a hook rejected the transition.
 */
public class FulfilmentProgressionBlockedException extends IllegalArgumentException {
    public FulfilmentProgressionBlockedException(String message) {
        super(message);
    }
}
