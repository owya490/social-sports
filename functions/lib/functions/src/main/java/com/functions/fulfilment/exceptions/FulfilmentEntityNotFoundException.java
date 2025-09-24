package com.functions.fulfilment.exceptions;

import com.functions.global.exceptions.NotFoundException;

/**
 * Exception thrown when a requested fulfilment entity is not found.
 * This exception should result in a 404 HTTP status code response.
 */
public class FulfilmentEntityNotFoundException extends NotFoundException {
    public FulfilmentEntityNotFoundException(String entityId) {
        super("No fulfilment entity found for ID: " + entityId);
    }
    
    public FulfilmentEntityNotFoundException(String entityId, Throwable cause) {
        super("No fulfilment entity found for ID: " + entityId, cause);
    }
}
