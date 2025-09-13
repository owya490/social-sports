package com.functions.global.models.responses;

/**
 * Standard error response format returned by java functions.
 * <p>
 * Example error response:
 * {
 * "errorMessage": "Description of what went wrong"
 * }
 */
public record ErrorResponse(
        String errorMessage) {
}
