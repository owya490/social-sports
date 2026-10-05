package com.functions.fulfilment.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import java.util.ArrayList;
import java.util.List;

import org.junit.Test;

import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;

public class ProcessFulfilmentSessionServiceTest {

    @Test
    public void completedMintsTicketsAndSendsPurchaseEmail() throws Exception {
        RecordingStore store = new RecordingStore();
        List<String> emails = new ArrayList<>();
        service(store, emails, true).process(sessionJson("COMPLETED", 2));

        assertEquals("session-1", store.minted.getId());
        assertNull(store.expired);
        assertEquals(List.of("ada@example.com"), emails);
    }

    @Test
    public void alreadyProcessedCompletedSessionDoesNotSendEmail() throws Exception {
        RecordingStore store = new RecordingStore();
        store.orderId = null;
        List<String> emails = new ArrayList<>();
        service(store, emails, true).process(sessionJson("COMPLETED", 2));

        assertEquals("session-1", store.minted.getId());
        assertEquals(0, emails.size());
    }

    @Test
    public void expiredRefundsVacancy() throws Exception {
        RecordingStore store = new RecordingStore();
        List<String> emails = new ArrayList<>();
        service(store, emails, true).process(sessionJson("EXPIRED", 2));

        assertEquals("session-1", store.expired.getId());
        assertNull(store.minted);
        assertEquals(0, emails.size());
    }

    @Test
    public void malformedMessageIsIgnored() throws Exception {
        RecordingStore store = new RecordingStore();
        service(store, new ArrayList<>(), true).process("{not json");

        assertNull(store.minted);
        assertNull(store.expired);
    }

    @Test
    public void missingTicketQuantityIsIgnored() throws Exception {
        RecordingStore store = new RecordingStore();
        service(store, new ArrayList<>(), true).process(sessionJson("COMPLETED", null));

        assertNull(store.minted);
        assertNull(store.expired);
    }

    @Test
    public void purchaseEmailFailureIsAcknowledged() throws Exception {
        RecordingStore store = new RecordingStore();
        service(store, new ArrayList<>(), false).process(sessionJson("COMPLETED", 2));
        assertEquals("session-1", store.minted.getId());
    }

    @Test
    public void completedWithoutPriceOrEmailIsIgnored() throws Exception {
        RecordingStore store = new RecordingStore();
        service(store, new ArrayList<>(), true).process(sessionJson("COMPLETED", 2, null, "ada@example.com"));
        service(store, new ArrayList<>(), true).process(sessionJson("COMPLETED", 2, 1000, null));
        assertNull(store.minted);
    }

    private static ProcessFulfilmentSessionService service(
            RecordingStore store, List<String> emails, boolean emailSent) {
        return new ProcessFulfilmentSessionService(store, (eventId, visibility, email, firstName, orderId) -> {
            emails.add(email);
            return emailSent;
        });
    }

    private static String sessionJson(String status, Integer numTickets) {
        return sessionJson(status, numTickets, 1000, "ada@example.com");
    }

    private static String sessionJson(String status, Integer numTickets, Integer price, String email) {
        return """
                {
                  "id": "session-1",
                  "type": "CHECKOUT",
                  "status": "%s",
                  "purchaserEmail": %s,
                  "purchaserName": "Ada",
                  "numTickets": %s,
                  "price": %s,
                  "eventTicketTypeId": "general",
                  "eventData": { "eventId": "event-1", "isPrivate": true },
                  "fulfilmentEntityIds": [],
                  "fulfilmentEntityMap": {}
                }
                """.formatted(
                status,
                email == null ? "null" : "\"" + email + "\"",
                numTickets == null ? "null" : numTickets.toString(),
                price == null ? "null" : price.toString());
    }

    private static final class RecordingStore implements ProcessFulfilmentSessionService.Store {
        private FulfilmentSession minted;
        private FulfilmentSession expired;
        private String orderId = "order-1";

        @Override
        public String mint(FulfilmentSession session) {
            minted = session;
            return orderId;
        }

        @Override
        public void refundVacancy(FulfilmentSession session) {
            expired = session;
        }
    }
}
