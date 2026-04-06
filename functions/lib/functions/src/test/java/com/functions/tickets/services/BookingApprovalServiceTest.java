package com.functions.tickets.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import com.functions.events.models.EventData;
import com.functions.tickets.models.Order;

public class BookingApprovalServiceTest {
    @Test
    public void sendPurchaseEmailAfterApprovalUsesPrivateVisibilityAndOrderDetails() {
        EventData eventData = new EventData();
        eventData.setEventId("event-123");
        eventData.setIsPrivate(true);

        Order order = new Order();
        order.setOrderId("order-123");
        order.setEmail("buyer@example.com");
        order.setFullName("Taylor Buyer");

        String[] captured = new String[5];
        boolean result = BookingApprovalService.sendPurchaseEmailAfterApproval(
                order,
                eventData,
                (eventId, visibility, customerEmail, fullName, orderId) -> {
                    captured[0] = eventId;
                    captured[1] = visibility;
                    captured[2] = customerEmail;
                    captured[3] = fullName;
                    captured[4] = orderId;
                    return true;
                });

        assertTrue(result);
        assertEquals("event-123", captured[0]);
        assertEquals("Private", captured[1]);
        assertEquals("buyer@example.com", captured[2]);
        assertEquals("Taylor Buyer", captured[3]);
        assertEquals("order-123", captured[4]);
    }

    @Test
    public void sendPurchaseEmailAfterApprovalUsesPublicVisibilityWhenEventIsNotPrivate() {
        EventData eventData = new EventData();
        eventData.setEventId("event-123");
        eventData.setIsPrivate(false);

        Order order = new Order();
        order.setOrderId("order-123");
        order.setEmail("public@example.com");
        order.setFullName("Jordan Public");

        boolean result = BookingApprovalService.sendPurchaseEmailAfterApproval(
                order,
                eventData,
                (eventId, visibility, customerEmail, fullName, orderId) -> {
                    assertEquals("Public", visibility);
                    assertEquals("public@example.com", customerEmail);
                    assertEquals("Jordan Public", fullName);
                    return false;
                });

        assertFalse(result);
    }
}
