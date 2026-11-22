package com.functions.events.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.fail;
import static org.mockito.Mockito.CALLS_REAL_METHODS;
import static org.mockito.Mockito.mockStatic;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.events.models.EventCollectionData;
import com.functions.events.models.EventData;
import com.functions.events.models.EventTicketType;
import com.functions.events.models.responses.GetPartnerEventCollectionResponse;
import com.functions.events.repositories.EventCollectionsRepository;
import com.functions.events.repositories.EventsRepository;
import com.functions.global.exceptions.NotFoundException;
import com.google.cloud.Timestamp;

public class PartnerEventLookupServiceTest {
    private static final String ORGANISER = "partner-organiser";
    private static final Timestamp NOW = Timestamp.parseTimestamp("2026-11-19T08:00:00Z");
    private MockedStatic<EventsRepository> events;
    private MockedStatic<EventCollectionsRepository> collections;
    private MockedStatic<Timestamp> clock;

    @Before
    public void setUp() {
        events = mockStatic(EventsRepository.class);
        collections = mockStatic(EventCollectionsRepository.class);
        clock = mockStatic(Timestamp.class, CALLS_REAL_METHODS);
        clock.when(Timestamp::now).thenReturn(NOW);
    }

    @After
    public void tearDown() {
        clock.close();
        collections.close();
        events.close();
    }

    @Test
    public void returnsOneUpcomingEventOwnedByThePartner() {
        EventData upcoming = event("event-1");
        events.when(() -> EventsRepository.getActivePublicEventById("event-1")).thenReturn(Optional.of(upcoming));

        assertEquals("event-1", EventsService.getPublicPartnerEvent(ORGANISER, "event-1").event().eventId());
    }

    @Test
    public void hidesMissingPastAndForeignEvents() {
        EventData past = event("past");
        past.setStartDate(Timestamp.ofTimeSecondsAndNanos(NOW.getSeconds() - 1, 0));
        EventData foreign = event("foreign");
        foreign.setOrganiserId("someone-else");
        events.when(() -> EventsRepository.getActivePublicEventById("missing")).thenReturn(Optional.empty());
        events.when(() -> EventsRepository.getActivePublicEventById("past")).thenReturn(Optional.of(past));
        events.when(() -> EventsRepository.getActivePublicEventById("foreign")).thenReturn(Optional.of(foreign));

        for (String eventId : List.of("missing", "past", "foreign")) {
            try {
                EventsService.getPublicPartnerEvent(ORGANISER, eventId);
                fail("Expected " + eventId + " to be unavailable");
            } catch (NotFoundException expected) {
            }
        }
    }

    @Test
    public void returnsCollectionEventsInStoredOrderAndDropsUnavailableOnes() {
        EventCollectionData collection = new EventCollectionData();
        collection.setName("Friday games");
        collection.setDescription("This week");
        collection.setImage("  ");
        collection.setOrganiserId(ORGANISER);
        collection.setIsPrivate(false);
        collection.setEventIds(List.of("later", "missing", "later", "past", "first"));
        collections.when(() -> EventCollectionsRepository.getPublicEventCollectionById("collection-1"))
                .thenReturn(Optional.of(collection));
        EventData past = event("past");
        past.setStartDate(Timestamp.ofTimeSecondsAndNanos(NOW.getSeconds() - 60, 0));
        EventData later = event("later");
        later.setStartDate(Timestamp.ofTimeSecondsAndNanos(NOW.getSeconds() + 7200, 0));
        EventData first = event("first");
        events.when(() -> EventsRepository.getActivePublicEventsByOrganiser(ORGANISER))
                .thenReturn(List.of(past, first, later));

        GetPartnerEventCollectionResponse response = EventsService.getPublicPartnerEventCollection(ORGANISER,
                "collection-1");

        assertEquals("collection-1", response.eventCollectionId());
        assertEquals("Friday games", response.name());
        assertEquals("This week", response.description());
        assertNull(response.image());
        assertEquals(List.of("later", "first"), response.events().stream().map(event -> event.eventId()).toList());
    }

    @Test
    public void hidesCollectionsThatAreMissingPrivateOrOwnedBySomeoneElse() {
        EventCollectionData foreign = new EventCollectionData();
        foreign.setOrganiserId("someone-else");
        foreign.setIsPrivate(false);
        EventCollectionData markedPrivate = new EventCollectionData();
        markedPrivate.setOrganiserId(ORGANISER);
        markedPrivate.setIsPrivate(true);
        collections.when(() -> EventCollectionsRepository.getPublicEventCollectionById("missing"))
                .thenReturn(Optional.empty());
        collections.when(() -> EventCollectionsRepository.getPublicEventCollectionById("foreign"))
                .thenReturn(Optional.of(foreign));
        collections.when(() -> EventCollectionsRepository.getPublicEventCollectionById("private"))
                .thenReturn(Optional.of(markedPrivate));

        for (String collectionId : List.of("missing", "foreign", "private")) {
            try {
                EventsService.getPublicPartnerEventCollection(ORGANISER, collectionId);
                fail("Expected " + collectionId + " to be unavailable");
            } catch (NotFoundException expected) {
            }
        }
        events.verifyNoInteractions();
    }

    private EventData event(String id) {
        EventData event = new EventData();
        event.setEventId(id);
        event.setOrganiserId(ORGANISER);
        event.setName("Public event");
        event.setIsActive(true);
        event.setIsPrivate(false);
        event.setStartDate(Timestamp.ofTimeSecondsAndNanos(NOW.getSeconds() + 3600, 0));
        event.setEndDate(Timestamp.ofTimeSecondsAndNanos(NOW.getSeconds() + 7200, 0));
        event.setPaymentsActive(true);
        EventTicketType ticket = new EventTicketType();
        ticket.setId("type-1");
        ticket.setName("General Admission");
        ticket.setPrice(1800);
        ticket.setVacancy(4);
        ticket.setCapacity(10);
        event.setEventTicketTypes(Map.of("type-1", ticket));
        return event;
    }
}
