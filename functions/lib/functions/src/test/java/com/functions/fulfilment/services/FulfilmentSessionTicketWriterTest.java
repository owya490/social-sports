package com.functions.fulfilment.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import java.util.ArrayList;
import java.util.List;

import org.junit.Test;

import com.functions.events.models.EventMetadata;
import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;

public class FulfilmentSessionTicketWriterTest {

    @Test
    public void sessionIdIsRecordedWithoutCheckoutSessionIds() {
        EventMetadata metadata = new EventMetadata();
        metadata.setCompletedStripeCheckoutSessionIds(new ArrayList<>(List.of("cs_existing")));

        FulfilmentSessionTicketWriter.prepareCompletedSessionMetadata(metadata, "session-1");
        FulfilmentSessionTicketWriter.prepareCompletedSessionMetadata(metadata, "session-1");

        assertEquals(List.of("session-1"), metadata.getCompletedFulfilmentSessionIds());
        assertEquals(List.of("cs_existing"), metadata.getCompletedStripeCheckoutSessionIds());
    }

    @Test
    public void endEntityIdFindsTheEndStep() throws Exception {
        assertEquals("end-1", FulfilmentSessionTicketWriter.endEntityId(session(true)));
        assertNull(FulfilmentSessionTicketWriter.endEntityId(session(false)));
    }

    private static FulfilmentSession session(boolean includeEnd) throws Exception {
        String endEntity = includeEnd
                ? """
                        , "end-1": { "type": "END" }
                  """
                : "";
        String endId = includeEnd ? ", \"end-1\"" : "";
        String json = """
                {
                  "id": "session-1",
                  "type": "CHECKOUT",
                  "status": "COMPLETED",
                  "purchaserEmail": "ada@example.com",
                  "numTickets": 1,
                  "price": 1000,
                  "eventTicketTypeId": "general",
                  "eventData": { "eventId": "event-1", "isPrivate": false },
                  "fulfilmentEntityIds": ["forms-1"%s],
                  "fulfilmentEntityMap": {
                    "forms-1": {
                      "type": "FORMS",
                      "formId": "form-1",
                      "eventId": "event-1",
                      "formResponseId": "resp-1"
                    }%s
                  }
                }
                """.formatted(endId, endEntity);
        return FulfilmentSession.fromJson(json);
    }
}
