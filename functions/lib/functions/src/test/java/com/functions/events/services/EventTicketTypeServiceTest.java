package com.functions.events.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.util.LinkedHashMap;
import java.util.Map;

import org.junit.Test;

import com.functions.events.models.EventData;
import com.functions.events.models.EventTicketType;
import com.functions.events.models.ResolvedEventTicketType;
import com.functions.stripe.exceptions.CheckoutVacancyException;
import com.functions.tickets.models.Ticket;

public class EventTicketTypeServiceTest {

    @Test
    public void resolveDefaultsToGeneralAdmissionByName() {
        EventData event = baseEvent();
        EventTicketType general = ticketType("g1", EventTicketTypeService.GENERAL_TICKET_TYPE_NAME, 1000, 10, 8);
        EventTicketType vip = ticketType("v1", "VIP", 5000, 5, 5);
        event.setEventTicketTypes(mapOf(general, vip));

        ResolvedEventTicketType resolved = EventTicketTypeService.resolve(event);

        assertEquals("g1", resolved.getId());
        assertEquals(EventTicketTypeService.GENERAL_TICKET_TYPE_NAME, resolved.getName());
        assertEquals(Integer.valueOf(1000), resolved.getPrice());
        assertEquals(Integer.valueOf(8), resolved.getVacancy());
    }

    @Test
    public void resolveUsesMapValues() {
        EventData event = baseEvent();
        EventTicketType general = ticketType("g1", EventTicketTypeService.GENERAL_TICKET_TYPE_NAME, 2500, 40, 22);
        event.setEventTicketTypes(mapOf(general));

        ResolvedEventTicketType resolved = EventTicketTypeService.resolve(event);

        assertEquals("g1", resolved.getId());
        assertEquals(Integer.valueOf(2500), resolved.getPrice());
        assertEquals(Integer.valueOf(40), resolved.getCapacity());
        assertEquals(Integer.valueOf(22), resolved.getVacancy());
    }

    @Test
    public void resolveFallsBackToSoleMapEntry() {
        EventData event = baseEvent();
        EventTicketType only = ticketType("sole-1", "Standard", 500, 20, 15);
        event.setEventTicketTypes(mapOf(only));

        ResolvedEventTicketType resolved = EventTicketTypeService.resolve(event);

        assertEquals("sole-1", resolved.getId());
        assertEquals("Standard", resolved.getName());
        assertEquals(Integer.valueOf(500), resolved.getPrice());
        assertEquals(Integer.valueOf(15), resolved.getVacancy());
    }

    @Test
    public void resolveThrowsWhenMapMissing() {
        EventData event = baseEvent();
        event.setEventTicketTypes(null);

        try {
            EventTicketTypeService.resolve(event);
            fail("Expected IllegalStateException");
        } catch (IllegalStateException e) {
            assertTrue(e.getMessage().contains("missing eventTicketTypes"));
        }
    }

    @Test
    public void validateAvailabilityThrowsWhenInsufficient() {
        ResolvedEventTicketType type = ResolvedEventTicketType.builder()
                .id("g1")
                .name(EventTicketTypeService.GENERAL_TICKET_TYPE_NAME)
                .price(1000)
                .vacancy(1)
                .capacity(10)
                .build();

        try {
            EventTicketTypeService.validateAvailability(type, 2);
            fail("Expected CheckoutVacancyException");
        } catch (CheckoutVacancyException e) {
            assertTrue(e.getMessage().contains("Insufficient tickets"));
        }
    }

    @Test
    public void stampTicketSetsTypeFields() {
        Ticket ticket = new Ticket();
        ResolvedEventTicketType type = ResolvedEventTicketType.builder()
                .id("g1")
                .name(EventTicketTypeService.GENERAL_TICKET_TYPE_NAME)
                .price(1000)
                .vacancy(5)
                .capacity(10)
                .build();

        EventTicketTypeService.stampTicket(ticket, type);

        assertEquals("g1", ticket.getEventTicketTypeId());
        assertEquals(EventTicketTypeService.GENERAL_TICKET_TYPE_NAME, ticket.getEventTicketTypeName());
    }

    private static EventData baseEvent() {
        EventData event = new EventData();
        event.setEventId("event-1");
        return event;
    }

    private static EventTicketType ticketType(String id, String name, int price, int capacity, int vacancy) {
        EventTicketType type = new EventTicketType();
        type.setId(id);
        type.setName(name);
        type.setPrice(price);
        type.setCapacity(capacity);
        type.setVacancy(vacancy);
        return type;
    }

    private static Map<String, EventTicketType> mapOf(EventTicketType... types) {
        Map<String, EventTicketType> map = new LinkedHashMap<>();
        for (EventTicketType type : types) {
            map.put(type.getId(), type);
        }
        return map;
    }
}
