package com.functions.stripe.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import com.functions.events.models.EventMetadata;

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
}
