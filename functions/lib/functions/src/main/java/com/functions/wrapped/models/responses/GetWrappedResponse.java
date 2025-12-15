package com.functions.wrapped.models.responses;

import com.functions.wrapped.models.SportshubWrappedData;

/**
 * Response containing the Sportshub Wrapped data for an organiser.
 */
public record GetWrappedResponse(
    SportshubWrappedData sportshubWrappedData
) {}

