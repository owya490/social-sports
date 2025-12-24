package com.functions.emails;

/**
 * Represents an HTTP response result with status code and message.
 */
public class HttpResponseResult {

    private final int statusCode;

    private final String message;

    public HttpResponseResult(int statusCode, String message) {
        this.statusCode = statusCode;
        this.message = message;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getMessage() {
        return message;
    }
}

