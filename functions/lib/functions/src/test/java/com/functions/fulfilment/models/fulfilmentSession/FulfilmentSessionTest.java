package com.functions.fulfilment.models.fulfilmentSession;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import com.functions.fulfilment.models.fulfilmentEntities.DetailsFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.FormsFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentSession.PyngCheckoutFulfilmentSession;

public class FulfilmentSessionTest {

    @Test
    public void fromJsonReadsSessionFieldsAndFormEntity() throws Exception {
        String json = """
                {
                  "id": "session-1",
                  "type": "CHECKOUT",
                  "status": "COMPLETED",
                  "purchaserEmail": "ada@example.com",
                  "purchaserName": "Ada Lovelace",
                  "numTickets": 2,
                  "price": 1500,
                  "eventTicketTypeId": "general",
                  "eventData": { "eventId": "event-1", "isPrivate": false },
                  "fulfilmentEntityIds": ["form-1"],
                  "fulfilmentEntityMap": {
                    "form-1": {
                      "type": "FORMS",
                      "formId": "form-1",
                      "eventId": "event-1",
                      "formResponseId": "response-1"
                    }
                  }
                }
                """;

        FulfilmentSession session = FulfilmentSession.fromJson(json);

        assertEquals("session-1", session.getId());
        assertEquals(FulfilmentSessionType.CHECKOUT, session.getType());
        assertEquals(FulfilmentSessionStatus.COMPLETED, session.getStatus());
        assertEquals("ada@example.com", session.getPurchaserEmail());
        assertEquals("Ada Lovelace", session.getPurchaserName());
        assertTrue(session instanceof CheckoutFulfilmentSession);
        CheckoutFulfilmentSession checkout = (CheckoutFulfilmentSession) session;
        assertEquals(Integer.valueOf(2), checkout.getNumTickets());
        assertEquals(Integer.valueOf(1500), checkout.getPrice());
        assertEquals("general", checkout.getEventTicketTypeId());
        assertEquals("event-1", session.getEventData().getEventId());
        FormsFulfilmentEntity forms = (FormsFulfilmentEntity) session.getFulfilmentEntityMap().get("form-1");
        assertEquals("response-1", forms.getFormResponseId());
    }

    @Test
    public void fromJsonReadsPyngCheckoutWithDetails() throws Exception {
        String json = """
                {
                  "id": "session-1",
                  "type": "PYNG_CHECKOUT",
                  "status": "COMPLETED",
                  "purchaserEmail": "ada@example.com",
                  "purchaserName": "Ada Lovelace",
                  "numTickets": 1,
                  "price": 3000,
                  "eventTicketTypeId": "general",
                  "eventData": { "eventId": "event-1" },
                  "fulfilmentEntityIds": ["details-1"],
                  "fulfilmentEntityMap": {
                    "details-1": { "type": "DETAILS" }
                  },
                  "pyngMetadata": { "checkoutSessionId": "cs-1", "status": "SUCCEEDED" }
                }
                """;

        FulfilmentSession session = FulfilmentSession.fromJson(json);

        assertTrue(session instanceof PyngCheckoutFulfilmentSession);
        PyngCheckoutFulfilmentSession pyng = (PyngCheckoutFulfilmentSession) session;
        assertEquals(Integer.valueOf(3000), pyng.getPrice());
        assertEquals("cs-1", pyng.getPyngMetadata().getCheckoutSessionId());
        assertTrue(session.getFulfilmentEntityMap().get("details-1") instanceof DetailsFulfilmentEntity);
    }
}
