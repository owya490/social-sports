package com.functions.global.exceptions;

public class AuthorizationException extends RuntimeException {
    public AuthorizationException(String message) {
        super(message);
    }
}
