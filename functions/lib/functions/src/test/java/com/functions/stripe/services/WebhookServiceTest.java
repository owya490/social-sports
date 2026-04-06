package com.functions.stripe.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.Test;

import com.functions.events.models.Attendee;
import com.functions.events.models.EventMetadata;
import com.functions.events.models.Purchaser;
import com.functions.fulfilment.models.fulfilmentEntities.FormsFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.StripeFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentSession.CheckoutFulfilmentSession;
import com.functions.tickets.models.Ticket;
import com.stripe.model.LineItem;
import com.stripe.model.checkout.Session;

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
    public void initializeEventMetadataHandlesPartialMetadata() {
        EventMetadata partialMetadata = new EventMetadata();
        partialMetadata.setOrganiserId("existing-organiser");
        partialMetadata.setPurchaserMap(new HashMap<>());

        EventMetadata eventMetadata = WebhookService.initializeEventMetadata(partialMetadata, "organiser-123");

        assertEquals("existing-organiser", eventMetadata.getOrganiserId());
        assertNotNull(eventMetadata.getPurchaserMap());
        assertEquals(Integer.valueOf(0), eventMetadata.getCompleteTicketCount());
        assertNotNull(eventMetadata.getOrderIds());
        assertNotNull(eventMetadata.getCompletedStripeCheckoutSessionIds());
        assertNotNull(eventMetadata.getCompletedStripePaymentIntentIds());
        assertTrue(eventMetadata.getPurchaserMap().isEmpty());
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
    public void applyAttendanceToEventMetadataDefaultsNullNestedCounters() {
        EventMetadata eventMetadata = WebhookService.initializeEventMetadata(null, "organiser-123");
        Purchaser purchaser = new Purchaser();
        purchaser.setEmail("buyer@example.com");
        purchaser.setAttendees(new HashMap<>());
        purchaser.setTotalTicketCount(null);

        Attendee attendee = new Attendee();
        attendee.setPhone("0400000000");
        attendee.setTicketCount(null);
        purchaser.getAttendees().put("Taylor Buyer", attendee);
        eventMetadata.getPurchaserMap().put("266944698700326368151495154829773939458", purchaser);

        EventMetadata updatedMetadata = WebhookService.applyAttendanceToEventMetadata(
                eventMetadata,
                "organiser-123",
                "buyer@example.com",
                "Taylor Buyer",
                "0400000000",
                2,
                List.of("form-1"));

        Purchaser updatedPurchaser = updatedMetadata.getPurchaserMap()
                .get("266944698700326368151495154829773939458");
        Attendee updatedAttendee = updatedPurchaser.getAttendees().get("Taylor Buyer");

        assertEquals(Integer.valueOf(2), updatedPurchaser.getTotalTicketCount());
        assertEquals(Integer.valueOf(2), updatedAttendee.getTicketCount());
        assertEquals(List.of("form-1"), updatedAttendee.getFormResponseIds());
    }

    @Test
    public void rollbackAttendanceFromEventMetadataRemovesOnlyCanceledTickets() {
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
                List.of("form-3"));

        EventMetadata rolledBackMetadata = WebhookService.rollbackAttendanceFromEventMetadata(
                eventMetadata,
                "organiser-123",
                "buyer@example.com",
                "Taylor Buyer",
                List.of(ticket("form-1"), ticket("form-2")));

        Purchaser purchaser = rolledBackMetadata.getPurchaserMap()
                .get("266944698700326368151495154829773939458");
        Attendee attendee = purchaser.getAttendees().get("Taylor Buyer");

        assertEquals(Integer.valueOf(1), rolledBackMetadata.getCompleteTicketCount());
        assertEquals(Integer.valueOf(1), purchaser.getTotalTicketCount());
        assertEquals(Integer.valueOf(1), attendee.getTicketCount());
        assertEquals(List.of("form-3"), attendee.getFormResponseIds());
    }

    @Test
    public void rollbackAttendanceFromEventMetadataPrunesEmptyAttendeeAndPurchaser() {
        EventMetadata eventMetadata = WebhookService.applyAttendanceToEventMetadata(
                null,
                "organiser-123",
                "buyer@example.com",
                "Taylor Buyer",
                "0400000000",
                2,
                List.of("form-1", "form-2"));

        EventMetadata rolledBackMetadata = WebhookService.rollbackAttendanceFromEventMetadata(
                eventMetadata,
                "organiser-123",
                "buyer@example.com",
                "Taylor Buyer",
                List.of(ticket("form-1"), ticket("form-2")));

        assertEquals(Integer.valueOf(0), rolledBackMetadata.getCompleteTicketCount());
        assertTrue(rolledBackMetadata.getPurchaserMap().isEmpty());
    }

    @Test
    public void sendPurchaseEmailWithRetriesRetriesFullWorkflowUntilSuccess() {
        int[] attempts = { 0 };

        boolean result = WebhookService.sendPurchaseEmailWithRetries(
                "event-123",
                "Public",
                "buyer@example.com",
                "Taylor Buyer",
                "order-123",
                4,
                0,
                (eventId, visibility, customerEmail, fullName, orderId) -> {
                    attempts[0]++;
                    if (attempts[0] == 1) {
                        return false;
                    }
                    if (attempts[0] == 2) {
                        throw new IllegalStateException("transient Firestore failure");
                    }
                    return true;
                });

        assertTrue(result);
        assertEquals(3, attempts[0]);
    }

    @Test
    public void sendPurchaseEmailWithRetriesStopsAfterMaxAttempts() {
        int[] attempts = { 0 };

        boolean result = WebhookService.sendPurchaseEmailWithRetries(
                "event-123",
                "Public",
                "buyer@example.com",
                "Taylor Buyer",
                "order-123",
                3,
                0,
                (eventId, visibility, customerEmail, fullName, orderId) -> {
                    attempts[0]++;
                    return false;
                });

        assertFalse(result);
        assertEquals(3, attempts[0]);
    }

    @Test
    public void sendPurchaseEmailWithRetriesStopsImmediatelyWhenInterrupted() {
        int[] attempts = { 0 };

        boolean result = WebhookService.sendPurchaseEmailWithRetries(
                "event-123",
                "Public",
                "buyer@example.com",
                "Taylor Buyer",
                "order-123",
                3,
                0,
                (eventId, visibility, customerEmail, fullName, orderId) -> {
                    attempts[0]++;
                    throw new InterruptedException("stop retrying");
                });

        assertFalse(result);
        assertEquals(1, attempts[0]);
        assertTrue(Thread.currentThread().isInterrupted());
        Thread.interrupted();
    }

    @Test
    public void shouldSendPurchaseEmailAfterCheckoutSkipsManualCaptureOrders() {
        assertFalse(WebhookService.shouldSendPurchaseEmailAfterCheckout("manual"));
        assertFalse(WebhookService.shouldSendPurchaseEmailAfterCheckout("MANUAL"));
        assertTrue(WebhookService.shouldSendPurchaseEmailAfterCheckout("automatic"));
        assertTrue(WebhookService.shouldSendPurchaseEmailAfterCheckout(null));
    }

    @Test
    public void getRequiredCheckoutQuantityReturnsSingleLineItemQuantity() {
        LineItem lineItem = new LineItem();
        lineItem.setQuantity(3L);

        long quantity = WebhookService.getRequiredCheckoutQuantity(
                List.of(lineItem),
                "cs_test_123",
                true);

        assertEquals(3L, quantity);
    }

    @Test
    public void getRequiredCheckoutQuantityRejectsMissingLineItemsForExpiredCheckout() {
        try {
            WebhookService.getRequiredCheckoutQuantity(List.of(), "cs_test_123", true);
            fail("Expected malformed expired checkout to be rejected");
        } catch (IllegalStateException expected) {
            assertTrue(expected.getMessage().contains("expired checkout session"));
        }
    }

    @Test
    public void getRequiredCheckoutQuantityRejectsMissingQuantityForExpiredCheckout() {
        LineItem lineItem = new LineItem();

        try {
            WebhookService.getRequiredCheckoutQuantity(List.of(lineItem), "cs_test_123", true);
            fail("Expected expired checkout without quantity to be rejected");
        } catch (IllegalStateException expected) {
            assertTrue(expected.getMessage().contains("Missing quantity"));
        }
    }

    @Test
    public void extractFormResponseIdsFallsBackToEntityMapValuesWhenIdsAreMissing() {
        CheckoutFulfilmentSession fulfilmentSession = CheckoutFulfilmentSession.builder()
                .fulfilmentEntityMap(Map.of(
                        "entity-1", FormsFulfilmentEntity.builder().formResponseId("form-1").build(),
                        "entity-2", StripeFulfilmentEntity.builder().build(),
                        "entity-3", FormsFulfilmentEntity.builder().formResponseId("form-2").build()))
                .build();

        List<String> formResponseIds = WebhookService.extractFormResponseIds(fulfilmentSession);

        assertEquals(2, formResponseIds.size());
        assertTrue(formResponseIds.contains("form-1"));
        assertTrue(formResponseIds.contains("form-2"));
    }

    @Test
    public void extractFormResponseIdsUsesEntityIdsOrderingWhenPresent() {
        CheckoutFulfilmentSession fulfilmentSession = CheckoutFulfilmentSession.builder()
                .fulfilmentEntityMap(Map.of(
                        "entity-1", FormsFulfilmentEntity.builder().formResponseId("form-1").build(),
                        "entity-2", FormsFulfilmentEntity.builder().formResponseId("form-2").build()))
                .fulfilmentEntityIds(List.of("entity-2", "entity-1"))
                .build();

        List<String> formResponseIds = WebhookService.extractFormResponseIds(fulfilmentSession);

        assertEquals(List.of("form-2", "form-1"), formResponseIds);
    }

    @Test
    public void resolveApplicationFeesUsesShippingAmountFromTotalDetails() {
        Session.TotalDetails totalDetails = new Session.TotalDetails();
        totalDetails.setAmountShipping(450L);

        assertEquals(450L, WebhookService.resolveApplicationFees(totalDetails));
    }

    @Test
    public void resolveApplicationFeesDefaultsToZeroWhenShippingAmountMissing() {
        assertEquals(0L, WebhookService.resolveApplicationFees(new Session.TotalDetails()));
        assertEquals(0L, WebhookService.resolveApplicationFees(null));
    }

    @Test
    public void resolveDiscountsUsesDiscountAmountOrDefaultsToZero() {
        Session.TotalDetails totalDetails = new Session.TotalDetails();
        totalDetails.setAmountDiscount(125L);

        assertEquals(125L, WebhookService.resolveDiscounts(totalDetails));
        assertEquals(0L, WebhookService.resolveDiscounts(new Session.TotalDetails()));
        assertEquals(0L, WebhookService.resolveDiscounts(null));
    }

    private static Ticket ticket(String formResponseId) {
        Ticket ticket = new Ticket();
        ticket.setFormResponseId(formResponseId);
        return ticket;
    }
}
