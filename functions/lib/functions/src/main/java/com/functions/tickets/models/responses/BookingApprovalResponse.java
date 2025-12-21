package com.functions.tickets.models.responses;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.functions.tickets.models.BookingApprovalOperation;

/**
 * Response model for booking approval/rejection operation.
 */
public record BookingApprovalResponse(
        @JsonProperty("success") boolean success,
        @JsonProperty("orderId") String orderId,
        @JsonProperty("operation") BookingApprovalOperation operation,
        @JsonProperty("message") String message) {
}
