package com.functions.wrapped.models.requests;

/**
 * Request to get Sportshub Wrapped data for an organiser.
 * 
 * If wrappedId is provided, it will be verified against the stored data.
 * This is used for public share links where verification is required.
 * If wrappedId is null/empty, no verification is performed (for organiser's own view).
 */
public record GetWrappedRequest(
    String organiserId,
    int year,
    String wrappedId // Optional - if provided, verifies the share link
) {}

