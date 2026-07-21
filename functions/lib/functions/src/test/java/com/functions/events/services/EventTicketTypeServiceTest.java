package com.functions.events.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
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
    public void resolveDefaultsToGeneralByName() {
        EventData event = baseEvent();
        EventTicketType general = ticketType("g1", EventTicketTypeService.GENERAL_TICKET_TYPE_NAME, 1000, 10, 8);
        EventTicketType vip = ticketType("v1", "VIP", 5000, 5, 5);
        event.setEventTicketTypes(mapOf(general, vip));

        ResolvedEventTicketType resolved = EventTicketTypeService.resolve(event, null);

        assertEquals("g1", resolved.getId());
        assertEquals(EventTicketTypeService.GENERAL_TICKET_TYPE_NAME, resolved.getName());
        assertEquals(Integer.valueOf(1000), resolved.getPrice());
        assertEquals(Integer.valueOf(8), resolved.getVacancy());
        assertFalse(resolved.isSynthesized());
    }

    @Test
    public void resolveFallsBackToLegacyGeneralAdmissionName() {
        EventData event = baseEvent();
        EventTicketType legacy = ticketType("legacy-1", EventTicketTypeService.LEGACY_GENERAL_ADMISSION_NAME, 500, 20,
                15);
        event.setEventTicketTypes(mapOf(legacy));

        ResolvedEventTicketType resolved = EventTicketTypeService.resolve(event, null);

        assertEquals("legacy-1", resolved.getId());
        assertEquals(EventTicketTypeService.LEGACY_GENERAL_ADMISSION_NAME, resolved.getName());
    }

    @Test
    public void resolveSynthesizesWhenMapMissing() {
        EventData event = baseEvent();
        event.setPrice(2500);
        event.setCapacity(30);
        event.setVacancy(12);
        event.setEventTicketTypes(null);

        ResolvedEventTicketType resolved = EventTicketTypeService.resolve(event, null);

        assertEquals(EventTicketTypeService.GENERAL_TICKET_TYPE_NAME, resolved.getName());
        assertEquals(Integer.valueOf(2500), resolved.getPrice());
        assertEquals(Integer.valueOf(12), resolved.getVacancy());
        assertTrue(resolved.isSynthesized());
    }

    @Test
    public void validateAvailabilityThrowsWhenInsufficient() {
        ResolvedEventTicketType type = ResolvedEventTicketType.builder()
                .id("g1")
                .name("General")
                .price(1000)
                .vacancy(1)
                .capacity(10)
                .synthesized(false)
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
                .name("General")
                .price(1000)
                .vacancy(5)
                .capacity(10)
                .synthesized(false)
                .build();

        EventTicketTypeService.stampTicket(ticket, type);

        assertEquals("g1", ticket.getEventTicketTypeId());
        assertEquals("General", ticket.getEventTicketTypeName());
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
