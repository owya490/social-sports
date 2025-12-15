package com.functions.wrapped.models.requests;

/**
 * Request to get Sportshub Wrapped data for an organiser.
 */
public record GetWrappedRequest(
    String organiserId,
    int year
) {}

