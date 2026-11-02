package com.functions.fulfilment.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import org.junit.Test;

import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;
import com.functions.fulfilment.services.ProcessFulfilmentSessionService.RequestedTickets;

public class ProcessFulfilmentSessionServiceTest {

    @Test
    public void malformedMessageFailsSoPubSubCanDeadLetterIt() throws Exception {
        expectFailure("{not json", "Malformed");
    }

    @Test
    public void nullStatusFailsSoPubSubCanDeadLetterIt() throws Exception {
        String json = sessionJson("COMPLETED", 2).replace("\"status\": \"COMPLETED\"", "\"status\": null");
        expectFailure(json, "session-1");
    }

    @Test
    public void missingTicketQuantityFailsSoPubSubCanDeadLetterIt() throws Exception {
        expectFailure(sessionJson("COMPLETED", null), "session-1");
    }

    @Test
    public void pyngCheckoutProvidesTicketQuantityAndPrice() throws Exception {
        String json = sessionJson("COMPLETED", 2).replace("\"type\": \"CHECKOUT\"", "\"type\": \"PYNG_CHECKOUT\"");
        FulfilmentSession session = FulfilmentSession.fromJson(json);
        RequestedTickets tickets = ProcessFulfilmentSessionService.requestedTickets(session);

        assertEquals(Integer.valueOf(2), tickets.count());
        assertEquals("general", tickets.ticketTypeId());
        assertEquals(Integer.valueOf(1000), tickets.priceCents());
    }

    @Test
    public void completedWithoutPriceOrEmailFailsSoPubSubCanDeadLetterIt() throws Exception {
        expectFailure(sessionJson("COMPLETED", 2, null, "ada@example.com"), "session-1");
        expectFailure(sessionJson("COMPLETED", 2, 1000, null), "session-1");
    }

    private static void expectFailure(String json, String messagePart) throws Exception {
        try {
            new ProcessFulfilmentSessionService().process(json);
            fail("session should fail the invocation");
        } catch (IllegalStateException e) {
            assertTrue(e.getMessage().contains(messagePart));
        }
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
}
