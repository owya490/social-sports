package com.functions.fulfilment.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.fail;

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
    public void purchaseEmailFailureIsRetried() throws Exception {
        RecordingStore store = new RecordingStore();
        try {
            service(store, new ArrayList<>(), false).process(sessionJson("COMPLETED", 2));
            fail("expected purchase email failure to propagate");
        } catch (IllegalStateException e) {
            assertEquals("session-1", store.minted.getId());
        }
    }

    private static ProcessFulfilmentSessionService service(
            RecordingStore store, List<String> emails, boolean emailSent) {
        return new ProcessFulfilmentSessionService(store, (eventId, visibility, email, firstName, orderId) -> {
            emails.add(email);
            return emailSent;
        });
    }

    private static String sessionJson(String status, Integer numTickets) {
        String tickets = numTickets == null ? "null" : numTickets.toString();
        return """
                {
                  "id": "session-1",
                  "type": "CHECKOUT",
                  "status": "%s",
                  "purchaserEmail": "ada@example.com",
                  "purchaserName": "Ada",
                  "numTickets": %s,
                  "price": 1000,
                  "eventTicketTypeId": "general",
                  "eventData": { "eventId": "event-1", "isPrivate": true },
                  "fulfilmentEntityIds": [],
                  "fulfilmentEntityMap": {}
                }
                """.formatted(status, tickets);
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
