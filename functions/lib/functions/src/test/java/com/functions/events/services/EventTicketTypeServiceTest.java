package com.functions.events.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.junit.Test;

import com.functions.events.models.EventData;
import com.functions.events.models.EventTicketType;

public class EventTicketTypeServiceTest {

    @Test
    public void resolveFormIdPrefersTicketTypeFormId() {
        EventTicketType ticketType = ticketType("type-1", "VIP", "type-form");
        EventData event = eventWithTicketType(ticketType, "event-form");

        Optional<String> formId = EventTicketTypeService.resolveFormId(event, "type-1");

        assertEquals(Optional.of("type-form"), formId);
    }

    @Test
    public void resolveFormIdFallsBackToEventFormIdForGeneralAdmissionOnly() {
        EventTicketType ticketType = ticketType("type-1", EventTicketTypeService.GENERAL_TICKET_TYPE_NAME, null);
        EventData event = eventWithTicketType(ticketType, "event-form");

        Optional<String> formId = EventTicketTypeService.resolveFormId(event, "type-1");

        assertEquals(Optional.of("event-form"), formId);
    }

    @Test
    public void resolveFormIdReturnsEmptyForNonGeneralAdmissionWithoutForm() {
        EventTicketType ticketType = ticketType("type-1", "VIP", null);
        EventData event = eventWithTicketType(ticketType, "event-form");

        Optional<String> formId = EventTicketTypeService.resolveFormId(event, "type-1");

        assertTrue(formId.isEmpty());
    }

    @Test
    public void resolveFormIdFindsTicketTypeByIdFieldWhenMapKeyDiffers() {
        EventTicketType ticketType = ticketType("type-1", "VIP", "type-form");
        EventData event = new EventData();
        event.setFormId("event-form");
        Map<String, EventTicketType> ticketTypes = new HashMap<>();
        ticketTypes.put("map-key", ticketType);
        event.setEventTicketTypes(ticketTypes);

        Optional<String> formId = EventTicketTypeService.resolveFormId(event, "type-1");

        assertEquals(Optional.of("type-form"), formId);
    }

    @Test
    public void resolveFormIdReturnsEmptyWhenNoFormIds() {
        EventTicketType ticketType = ticketType("type-1", EventTicketTypeService.GENERAL_TICKET_TYPE_NAME, " ");
        EventData event = eventWithTicketType(ticketType, "");

        Optional<String> formId = EventTicketTypeService.resolveFormId(event, "type-1");

        assertTrue(formId.isEmpty());
    }

    @Test
    public void resolveFormIdReturnsEmptyForNullEvent() {
        assertFalse(EventTicketTypeService.resolveFormId(null, "type-1").isPresent());
    }

    private static EventTicketType ticketType(String id, String name, String formId) {
        EventTicketType ticketType = new EventTicketType();
        ticketType.setId(id);
        ticketType.setName(name);
        ticketType.setPrice(0);
        ticketType.setCapacity(10);
        ticketType.setVacancy(10);
        ticketType.setFormId(formId);
        return ticketType;
    }

    private static EventData eventWithTicketType(EventTicketType ticketType, String eventFormId) {
        EventData event = new EventData();
        event.setFormId(eventFormId);
        Map<String, EventTicketType> ticketTypes = new HashMap<>();
        ticketTypes.put(ticketType.getId(), ticketType);
        event.setEventTicketTypes(ticketTypes);
        return event;
    }
}
