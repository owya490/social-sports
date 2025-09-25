package com.functions.global.exceptions;

/**
 * Exception thrown when a requested resource is not found.
 * This exception should result in a 404 HTTP status code response.
 */
public class NotFoundException extends RuntimeException {
    
    public NotFoundException(String message) {
        super(message);
    }
    
    public NotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}