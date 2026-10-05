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
        RecordingTicketWriter tickets = new RecordingTicketWriter();
        List<String> emails = new ArrayList<>();
        service(tickets, emails, true).process(sessionJson("COMPLETED", 2));

        assertEquals("session-1", tickets.createdFor.getId());
        assertNull(tickets.refunded);
        assertEquals(List.of("ada@example.com"), emails);
    }

    @Test
    public void alreadyProcessedCompletedSessionDoesNotSendEmail() throws Exception {
        RecordingTicketWriter tickets = new RecordingTicketWriter();
        tickets.orderId = null;
        List<String> emails = new ArrayList<>();
        service(tickets, emails, true).process(sessionJson("COMPLETED", 2));

        assertEquals("session-1", tickets.createdFor.getId());
        assertEquals(0, emails.size());
    }

    @Test
    public void expiredRefundsVacancy() throws Exception {
        RecordingTicketWriter tickets = new RecordingTicketWriter();
        List<String> emails = new ArrayList<>();
        service(tickets, emails, true).process(sessionJson("EXPIRED", 2));

        assertEquals("session-1", tickets.refunded.getId());
        assertNull(tickets.createdFor);
        assertEquals(0, emails.size());
    }

    @Test
    public void malformedMessageIsIgnored() throws Exception {
        RecordingTicketWriter tickets = new RecordingTicketWriter();
        service(tickets, new ArrayList<>(), true).process("{not json");

        assertNull(tickets.createdFor);
        assertNull(tickets.refunded);
    }

    @Test
    public void missingTicketQuantityIsIgnored() throws Exception {
        RecordingTicketWriter tickets = new RecordingTicketWriter();
        service(tickets, new ArrayList<>(), true).process(sessionJson("COMPLETED", null));

        assertNull(tickets.createdFor);
        assertNull(tickets.refunded);
    }

    @Test
    public void purchaseEmailFailureIsAcknowledged() throws Exception {
        RecordingTicketWriter tickets = new RecordingTicketWriter();
        service(tickets, new ArrayList<>(), false).process(sessionJson("COMPLETED", 2));
        assertEquals("session-1", tickets.createdFor.getId());
    }

    @Test
    public void completedWithoutPriceOrEmailIsIgnored() throws Exception {
        RecordingTicketWriter tickets = new RecordingTicketWriter();
        service(tickets, new ArrayList<>(), true).process(sessionJson("COMPLETED", 2, null, "ada@example.com"));
        service(tickets, new ArrayList<>(), true).process(sessionJson("COMPLETED", 2, 1000, null));
        assertNull(tickets.createdFor);
    }

    private static ProcessFulfilmentSessionService service(
            RecordingTicketWriter tickets, List<String> emails, boolean emailSent) {
        return new ProcessFulfilmentSessionService(tickets, (eventId, visibility, email, firstName, orderId) -> {
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

    private static final class RecordingTicketWriter implements ProcessFulfilmentSessionService.TicketWriter {
        private FulfilmentSession createdFor;
        private FulfilmentSession refunded;
        private String orderId = "order-1";

        @Override
        public String createTicketsAndOrder(FulfilmentSession session) {
            createdFor = session;
            return orderId;
        }

        @Override
        public void refundVacancy(FulfilmentSession session) {
            refunded = session;
        }
    }
}
