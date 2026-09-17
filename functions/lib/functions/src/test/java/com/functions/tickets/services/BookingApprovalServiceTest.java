package com.functions.tickets.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import com.functions.stripe.models.PaymentIntentStatus;
import com.functions.tickets.models.BookingApprovalOperation;
import com.functions.tickets.models.OrderAndTicketStatus;
import com.functions.tickets.models.responses.BookingApprovalResponse;

public class BookingApprovalServiceTest {
    @Test
    public void succeededPaymentIntentStatusIsRecognized() {
        assertTrue(PaymentIntentStatus.SUCCEEDED.matches("succeeded"));
        assertFalse(PaymentIntentStatus.SUCCEEDED.matches("requires_capture"));
    }

    @Test
    public void succeededPaymentIntentIsRecoverableOnlyForApproval() {
        assertTrue(BookingApprovalService.isCapturedApproval(
                "succeeded", BookingApprovalOperation.APPROVE));
        assertFalse(BookingApprovalService.isCapturedApproval(
                "succeeded", BookingApprovalOperation.REJECT));
        assertFalse(BookingApprovalService.isCapturedApproval(
                "requires_capture", BookingApprovalOperation.APPROVE));
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
