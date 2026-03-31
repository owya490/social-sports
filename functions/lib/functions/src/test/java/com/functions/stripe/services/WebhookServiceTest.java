package com.functions.stripe.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import java.util.List;
import java.util.Map;

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

    @Test
    public void applyAttendanceToEventMetadataUsesLegacyPythonCompatibleEmailHash() {
        EventMetadata eventMetadata = WebhookService.applyAttendanceToEventMetadata(
                null,
                "organiser-123",
                "buyer@example.com",
                "Taylor Buyer",
                "0400000000",
                1,
                List.of());

        assertTrue(eventMetadata.getPurchaserMap()
                .containsKey("266944698700326368151495154829773939458"));
    }

    @Test
    public void extractFormResponseIdsFallsBackToEntityMapValuesWhenIdsAreMissing() {
        Map<String, Object> fulfilmentEntityMap = Map.of(
                "entity-1", Map.of("type", "FORMS", "formResponseId", "form-1"),
                "entity-2", Map.of("type", "STRIPE"),
                "entity-3", Map.of("type", "FORMS", "formResponseId", "form-2"));

        List<String> formResponseIds = WebhookService.extractFormResponseIds(fulfilmentEntityMap, null);

        assertEquals(2, formResponseIds.size());
        assertTrue(formResponseIds.contains("form-1"));
        assertTrue(formResponseIds.contains("form-2"));
    }

    @Test
    public void extractFormResponseIdsUsesEntityIdsOrderingWhenPresent() {
        Map<String, Object> fulfilmentEntityMap = Map.of(
                "entity-1", Map.of("type", "FORMS", "formResponseId", "form-1"),
                "entity-2", Map.of("type", "FORMS", "formResponseId", "form-2"));

        List<String> formResponseIds = WebhookService.extractFormResponseIds(
                fulfilmentEntityMap,
                List.of("entity-2", "entity-1"));

        assertEquals(List.of("form-2", "form-1"), formResponseIds);
    }
}
