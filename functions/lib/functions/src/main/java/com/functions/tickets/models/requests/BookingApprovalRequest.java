package com.functions.tickets.models.requests;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.functions.tickets.models.BookingApprovalOperation;

/**
 * Request model for approving or rejecting bookings by capturing or cancelling
 * funds for a Stripe PaymentIntent.
 */
public record BookingApprovalRequest(
        @JsonProperty("eventId") String eventId,
        @JsonProperty("organiserId") String organiserId,
        @JsonProperty("orderId") String orderId,
        @JsonProperty("bookingApprovalOperation") BookingApprovalOperation bookingApprovalOperation) {
}
