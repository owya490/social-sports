package com.functions.stripe.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import java.util.List;

import org.junit.Test;

import com.functions.events.models.Attendee;
import com.functions.events.models.EventMetadata;
import com.functions.tickets.models.OrderAndTicketStatus;

public class WebhookServiceTest {
    @Test
    public void initializeEventMetadataBootstrapsAllRequiredFields() {
        EventMetadata eventMetadata = WebhookService.initializeEventMetadata(null, "organiser-123");

        assertEquals("organiser-123", eventMetadata.getOrganiserId());
        assertEquals(Integer.valueOf(0), eventMetadata.getCompleteTicketCount());
        assertNotNull(eventMetadata.getPurchaserMap());
        assertNotNull(eventMetadata.getOrderIds());
        assertNotNull(eventMetadata.getCompletedStripeCheckoutSessionIds());
        assertNotNull(eventMetadata.getCompletedStripePaymentIntentIds());
        assertTrue(eventMetadata.getPurchaserMap().isEmpty());
        assertTrue(eventMetadata.getOrderIds().isEmpty());
        assertTrue(eventMetadata.getCompletedStripeCheckoutSessionIds().isEmpty());
        assertTrue(eventMetadata.getCompletedStripePaymentIntentIds().isEmpty());
    }

    @Test
    public void shouldRecordAttendanceForStatusOnlyReturnsTrueForApproved() {
        assertTrue(WebhookService.shouldRecordAttendanceForStatus(OrderAndTicketStatus.APPROVED));
        assertEquals(false, WebhookService.shouldRecordAttendanceForStatus(OrderAndTicketStatus.PENDING));
        assertEquals(false, WebhookService.shouldRecordAttendanceForStatus(OrderAndTicketStatus.REJECTED));
    }

    @Test
    public void applyAttendanceToEventMetadataAccumulatesCountsAndFormResponses() {
        EventMetadata eventMetadata = WebhookService.applyAttendanceToEventMetadata(
                null,
                "organiser-123",
                "buyer@example.com",
                "Taylor Buyer",
                "0400000000",
                2,
                List.of("form-1", "form-2"));

        eventMetadata = WebhookService.applyAttendanceToEventMetadata(
                eventMetadata,
                "organiser-123",
                "buyer@example.com",
                "Taylor Buyer",
                "0400000000",
                1,
                List.of("form-2", "form-3"));

        assertEquals(Integer.valueOf(3), eventMetadata.getCompleteTicketCount());
        assertEquals(1, eventMetadata.getPurchaserMap().size());

        Attendee attendee = eventMetadata.getPurchaserMap().values().iterator().next().getAttendees().get("Taylor Buyer");
        assertNotNull(attendee);
        assertEquals(Integer.valueOf(3), attendee.getTicketCount());
        assertEquals(List.of("form-1", "form-2", "form-3"), attendee.getFormResponseIds());
    }
}
