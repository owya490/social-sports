package com.functions.fulfilment.exceptions;

import com.functions.global.exceptions.NotFoundException;

/**
 * Exception thrown when a requested fulfilment session is not found.
 * This exception should result in a 404 HTTP status code response.
 */
public class FulfilmentSessionNotFoundException extends NotFoundException {
    
    public FulfilmentSessionNotFoundException(String sessionId) {
        super("No fulfilment session found for ID: " + sessionId);
    }
    
    public FulfilmentSessionNotFoundException(String sessionId, Throwable cause) {
        super("No fulfilment session found for ID: " + sessionId, cause);
    }
}