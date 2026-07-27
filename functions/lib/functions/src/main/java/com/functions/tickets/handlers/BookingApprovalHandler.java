package com.functions.tickets.handlers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.global.models.AuthContext;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.global.services.EventAuthorizationService;
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
    public BookingApprovalResponse handle(BookingApprovalRequest request, AuthContext authContext) throws Exception {
        // The organiserId in the request body is untrusted and deliberately ignored:
        // it is public data, so trusting it would let any signed-in user capture or
        // cancel any other organiser's payments. Everything downstream uses the uid
        // established from the verified Firebase ID token.
        String organiserId = authContext.requireUid();

        logger.info("Handling booking approval request for eventId: {}, organiserId: {}, orderId: {}, operation: {}",
                request.eventId(), organiserId, request.orderId(), request.bookingApprovalOperation());

        if (request.organiserId() != null && !organiserId.equals(request.organiserId())) {
            logger.warn("Booking approval organiserId mismatch: authenticated uid {} does not match "
                    + "requested organiserId {} for eventId {}. Using authenticated uid.",
                    organiserId, request.organiserId(), request.eventId());
        }

        EventAuthorizationService.requireOrganiserAccess(organiserId, request.eventId());

        BookingApprovalResponse response = BookingApprovalService.handleBookingApproval(request.eventId(),
                organiserId, request.orderId(), request.bookingApprovalOperation());

        logger.info("[BookingApprovalHandler] Booking {} operation completed for orderId: {}, success: {}",
                request.bookingApprovalOperation(), request.orderId(), response.success());

        return response;
    }
}