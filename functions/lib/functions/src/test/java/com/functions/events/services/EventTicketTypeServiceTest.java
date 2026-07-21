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
        event.setPrice(1000);
        event.setCapacity(10);
        event.setVacancy(8);
        EventTicketType general = ticketType("g1", EventTicketTypeService.GENERAL_TICKET_TYPE_NAME, 1000, 10, 8);
        EventTicketType vip = ticketType("v1", "VIP", 5000, 5, 5);
        event.setEventTicketTypes(mapOf(general, vip));

        ResolvedEventTicketType resolved = EventTicketTypeService.resolve(event, null);

        assertEquals("g1", resolved.getId());
        assertEquals(EventTicketTypeService.GENERAL_TICKET_TYPE_NAME, resolved.getName());
        assertEquals(Integer.valueOf(1000), resolved.getPrice());
        assertEquals(Integer.valueOf(8), resolved.getVacancy());
        assertTrue(resolved.isMirrorsTopLevel());
        assertFalse(resolved.isSynthesized());
    }

    @Test
    public void resolveReconcilesStaleGeneralMapToTopLevelFields() {
        EventData event = baseEvent();
        event.setPrice(2500);
        event.setCapacity(40);
        event.setVacancy(22);
        // Map deliberately stale vs top-level (common after 2-week hanging rollout)
        EventTicketType staleGeneral = ticketType("g1", EventTicketTypeService.GENERAL_TICKET_TYPE_NAME, 1000, 10, 3);
        event.setEventTicketTypes(mapOf(staleGeneral));

        ResolvedEventTicketType resolved = EventTicketTypeService.resolve(event, null);

        assertEquals("g1", resolved.getId());
        assertEquals(Integer.valueOf(2500), resolved.getPrice());
        assertEquals(Integer.valueOf(40), resolved.getCapacity());
        assertEquals(Integer.valueOf(22), resolved.getVacancy());
        assertTrue(resolved.isMirrorsTopLevel());
    }

    @Test
    public void resolveExplicitGeneralIdAlsoReconcilesToTopLevel() {
        EventData event = baseEvent();
        event.setPrice(900);
        event.setCapacity(15);
        event.setVacancy(7);
        EventTicketType staleGeneral = ticketType("g1", EventTicketTypeService.GENERAL_TICKET_TYPE_NAME, 100, 5, 1);
        event.setEventTicketTypes(mapOf(staleGeneral));

        ResolvedEventTicketType resolved = EventTicketTypeService.resolve(event, "g1");

        assertEquals(Integer.valueOf(900), resolved.getPrice());
        assertEquals(Integer.valueOf(15), resolved.getCapacity());
        assertEquals(Integer.valueOf(7), resolved.getVacancy());
        assertTrue(resolved.isMirrorsTopLevel());
    }

    @Test
    public void resolveExplicitNonGeneralKeepsMapValues() {
        EventData event = baseEvent();
        event.setPrice(1000);
        event.setCapacity(10);
        event.setVacancy(8);
        EventTicketType general = ticketType("g1", EventTicketTypeService.GENERAL_TICKET_TYPE_NAME, 1000, 10, 8);
        EventTicketType vip = ticketType("v1", "VIP", 5000, 5, 4);
        event.setEventTicketTypes(mapOf(general, vip));

        ResolvedEventTicketType resolved = EventTicketTypeService.resolve(event, "v1");

        assertEquals("v1", resolved.getId());
        assertEquals(Integer.valueOf(5000), resolved.getPrice());
        assertEquals(Integer.valueOf(4), resolved.getVacancy());
        assertFalse(resolved.isMirrorsTopLevel());
    }

    @Test
    public void resolveFallsBackToLegacyGeneralAdmissionName() {
        EventData event = baseEvent();
        event.setPrice(500);
        event.setCapacity(20);
        event.setVacancy(15);
        EventTicketType legacy = ticketType("legacy-1", EventTicketTypeService.LEGACY_GENERAL_ADMISSION_NAME, 500, 20,
                15);
        event.setEventTicketTypes(mapOf(legacy));

        ResolvedEventTicketType resolved = EventTicketTypeService.resolve(event, null);

        assertEquals("legacy-1", resolved.getId());
        assertEquals(EventTicketTypeService.LEGACY_GENERAL_ADMISSION_NAME, resolved.getName());
        assertTrue(resolved.isMirrorsTopLevel());
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
        assertTrue(resolved.isMirrorsTopLevel());
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
                .mirrorsTopLevel(true)
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
                .mirrorsTopLevel(true)
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
