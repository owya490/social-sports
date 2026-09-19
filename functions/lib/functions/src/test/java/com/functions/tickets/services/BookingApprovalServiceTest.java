package com.functions.tickets.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import com.functions.tickets.exceptions.OrderStatusConflictException;
import com.functions.tickets.models.BookingApprovalOperation;
import com.functions.tickets.models.OrderAndTicketStatus;
import com.functions.tickets.models.responses.BookingApprovalResponse;

public class BookingApprovalServiceTest {
    @Test
    public void succeededPaymentIntentIsRecognizedAsCaptured() {
        assertTrue(BookingApprovalService.isCapturedPaymentIntent("succeeded"));
        assertFalse(BookingApprovalService.isCapturedPaymentIntent("requires_capture"));
        assertFalse(BookingApprovalService.isCapturedPaymentIntent("canceled"));
    }

    @Test
    public void capturedPaymentApprovalReturnsSuccess() {
        BookingApprovalResponse response = BookingApprovalService.capturedPaymentResponse(
                "order-1", BookingApprovalOperation.APPROVE);

        assertTrue(response.success());
        assertEquals("order-1", response.orderId());
        assertEquals(BookingApprovalOperation.APPROVE, response.bookingApprovalOperation());
    }

    @Test(expected = OrderStatusConflictException.class)
    public void capturedPaymentRejectionThrowsConflict() {
        BookingApprovalService.capturedPaymentResponse("order-1", BookingApprovalOperation.REJECT);
    }

    @Test
    public void repeatedApprovalOfApprovedOrderReturnsSuccess() {
        BookingApprovalResponse response = BookingApprovalService.checkAlreadyCompletedOperation(
                OrderAndTicketStatus.APPROVED, "order-1", BookingApprovalOperation.APPROVE);

        assertNotNull(response);
        assertTrue(response.success());
        assertEquals("order-1", response.orderId());
        assertEquals(BookingApprovalOperation.APPROVE, response.bookingApprovalOperation());
    }

    @Test
    public void conflictingOperationDoesNotReturnIdempotentSuccess() {
        BookingApprovalResponse response = BookingApprovalService.checkAlreadyCompletedOperation(
                OrderAndTicketStatus.REJECTED, "order-1", BookingApprovalOperation.APPROVE);

        assertNull(response);
    }

    @Test
    public void pendingOrderDoesNotReturnIdempotentSuccess() {
        BookingApprovalResponse response = BookingApprovalService.checkAlreadyCompletedOperation(
                OrderAndTicketStatus.PENDING, "order-1", BookingApprovalOperation.APPROVE);

        assertNull(response);
    }

    @Test
    public void repeatedRejectionOfRejectedOrderReturnsSuccess() {
        BookingApprovalResponse response = BookingApprovalService.checkAlreadyCompletedOperation(
                OrderAndTicketStatus.REJECTED, "order-1", BookingApprovalOperation.REJECT);

        assertNotNull(response);
        assertTrue(response.success());
    }
}
