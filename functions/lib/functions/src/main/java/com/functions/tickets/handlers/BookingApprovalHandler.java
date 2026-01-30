package com.functions.tickets.handlers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.tickets.models.requests.BookingApprovalRequest;
import com.functions.tickets.models.responses.BookingApprovalResponse;
import com.functions.tickets.services.BookingApprovalService;
import com.functions.utils.JavaUtils;

/**
 * Handler for approving or rejecting bookings by capturing or cancelling funds
 * for a Stripe PaymentIntent.
 */
public class BookingApprovalHandler implements Handler<BookingApprovalRequest, BookingApprovalResponse> {
    private static final Logger logger = LoggerFactory.getLogger(BookingApprovalHandler.class);

    @Override
    public BookingApprovalRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), BookingApprovalRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse BookingApprovalRequest", e);
        }
    }

    @Override
    public BookingApprovalResponse handle(BookingApprovalRequest request) throws Exception {
        logger.info("Handling booking approval request for eventId: {}, organiserId: {}, orderId: {}, operation: {}",
                request.eventId(), request.organiserId(), request.orderId(), request.bookingApprovalOperation());

        boolean success = BookingApprovalService.handleBookingApproval(request.eventId(),
                request.organiserId(), request.orderId(), request.bookingApprovalOperation());

        logger.info("[BookingApprovalHandler] Booking {} operation completed for orderId: {}",
                request.bookingApprovalOperation(), request.orderId());

        if (!success) {
            throw new RuntimeException(String.format("Failed to execute %s operation for order %s",
                    request.bookingApprovalOperation(), request.orderId()));
        }

        return new BookingApprovalResponse(
                success,
                request.orderId(),
                request.bookingApprovalOperation(),
                String.format("Successfully executed %s operation for order %s",
                        request.bookingApprovalOperation(), request.orderId()));
    }
}
