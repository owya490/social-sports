package com.functions.events.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.Mockito.CALLS_REAL_METHODS;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.times;

import java.time.Instant;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Consumer;
import java.util.stream.Collectors;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;

import com.fasterxml.jackson.databind.JsonNode;
import com.functions.events.handlers.GetSyrioEventsHandler;
import com.functions.events.models.AbstractEventData.AttendeesMetadata;
import com.functions.events.models.EventData;
import com.functions.events.models.EventTicketType;
import com.functions.events.models.PaymentProvider;
import com.functions.events.models.ResolvedEventTicketType;
import com.functions.events.models.requests.GetSyrioEventsRequest;
import com.functions.events.models.responses.GetPartnerEventsResponse;
import com.functions.events.models.responses.GetPartnerEventsResponse.PartnerEvent;
import com.functions.events.models.responses.GetPartnerEventsResponse.PartnerTicketType;
import com.functions.events.repositories.EventsRepository;
import com.functions.fulfilment.payment.PaymentProviderPolicy;
import com.functions.fulfilment.pyng.PyngService;
import com.functions.global.models.AuthContext;
import com.functions.global.models.responses.UnifiedResponse;
import com.functions.users.services.Users;
import com.functions.utils.JavaUtils;
import com.google.cloud.Timestamp;
import com.stripe.model.Account;

public class PartnerEventsServiceTest {
    private static final String ORGANISER = "partner-organiser";
    private static final Timestamp NOW = Timestamp.parseTimestamp("2026-10-14T09:30:00Z");
    private MockedStatic<EventsRepository> repository;
    private MockedStatic<Timestamp> clock;

    @Before
    public void setUp() {
        repository = mockStatic(EventsRepository.class);
        clock = mockStatic(Timestamp.class, CALLS_REAL_METHODS);
        clock.when(Timestamp::now).thenReturn(NOW);
    }

    @After
    public void tearDown() {
        if (clock != null) {
            clock.close();
        }
        if (repository != null) {
            repository.close();
        }
    }

    @Test
    public void selectsUpcomingEventsAtTheBoundaryAndSortsStableTies() {
        EventData atNow = event("at-now");
        atNow.setStartDate(NOW);
        EventData past = event("past");
        past.setStartDate(Timestamp.ofTimeSecondsAndNanos(NOW.getSeconds() - 1, 999_999_999));
        EventData missingStart = event("missing-start");
        missingStart.setStartDate(null);
        EventData later = event("later");
        later.setStartDate(after(5400));
        EventData unavailable = event("b");
        unavailable.setPaused(true);
        unavailable.setRegistrationDeadline(after(-1800));
        unavailable.setEventTicketTypes(Map.of("type-1", ticket("type-1", "General Admission", 2500, 0)));

        List<PartnerEvent> result = load(later, unavailable, past, event("a"), missingStart, atNow).events();

        assertEquals(List.of("at-now", "a", "b", "later"), result.stream()
                .map(PartnerEvent::eventId).collect(Collectors.toList()));
        assertTrue(result.get(2).paused());
        assertEquals(after(-1800), result.get(2).registrationDeadline());
        assertTrue(result.get(2).ticketTypes().get(0).soldOut());
    }

    @Test
    public void serializesOnlyTheApprovedEventAndTicketFields() {
        EventData event = event("event-1");
        event.setDescription("Public event description");
        event.setLocation("Public venue");
        event.setImage("https://example.invalid/event.png");
        event.setThumbnail("https://example.invalid/thumbnail.png");
        event.setEventTags(List.of("volleyball"));
        event.setCapacity(200);
        event.setVacancy(150);
        event.setPrice(9999);
        event.setAccessCount(42);
        event.setFormId("private-event-form");
        event.setEventLink("https://example.invalid/internal-link");
        event.setStripeFeeToCustomer(true);
        event.setPromotionalCodesEnabled(true);
        event.setAttendees(Map.of("private@example.invalid", 1));
        AttendeesMetadata attendee = new AttendeesMetadata();
        attendee.setNames(List.of("Private attendee"));
        attendee.setPhones(List.of("private-phone"));
        event.setAttendeesMetadata(Map.of("private@example.invalid", attendee));
        EventTicketType ticket = event.getEventTicketTypes().get("type-1");
        ticket.setCapacity(80);
        ticket.setFormId("private-ticket-form");

        JsonNode json = JavaUtils.objectMapper.valueToTree(UnifiedResponse.success(load(event)));
        JsonNode publicEvent = json.path("data").path("events").get(0);
        JsonNode publicTicket = publicEvent.path("ticketTypes").get(0);

        assertEquals(Set.of("data"), fieldNames(json));
        assertEquals(Set.of("events"), fieldNames(json.path("data")));
        assertEquals(Set.of("eventId", "name", "description", "location", "startDate", "endDate",
                "registrationDeadline", "image", "thumbnail", "eventTags", "paused", "paymentsActive",
                "waitlistEnabled", "bookingApprovalEnabled", "maxTicketsPerTransaction", "supportedPaymentProviders",
                "ticketTypes"),
                fieldNames(publicEvent));
        assertEquals(Set.of("id", "name", "priceCents", "soldOut", "vacancy"), fieldNames(publicTicket));
        assertEquals("Public event description", publicEvent.path("description").asText());
        assertEquals("Public venue", publicEvent.path("location").asText());
        assertEquals("https://example.invalid/event.png", publicEvent.path("image").asText());
        assertEquals("https://example.invalid/thumbnail.png", publicEvent.path("thumbnail").asText());
        assertEquals("volleyball", publicEvent.path("eventTags").get(0).asText());
        assertEquals(Instant.parse("2026-10-14T10:30:00Z"), Instant.parse(publicEvent.path("startDate").asText()));
        assertEquals(Instant.parse("2026-10-14T11:30:00Z"), Instant.parse(publicEvent.path("endDate").asText()));
        assertEquals(Instant.parse("2026-10-14T10:00:00Z"), Instant.parse(publicEvent.path("registrationDeadline").asText()));
        assertTrue(publicEvent.path("startDate").asText().endsWith("Z"));
        assertEquals(2500, publicTicket.path("priceCents").asInt());
        assertEquals(4, publicTicket.path("vacancy").asInt());
        assertEquals(JavaUtils.objectMapper.valueToTree(List.of("STRIPE")), publicEvent.path("supportedPaymentProviders"));
        assertFalse(json.toString().contains("private"));
    }

    @Test
    public void reportsOnlyConfiguredImplementedHostedPaymentProviders() {
        List<ProviderCase> cases = List.of(
                new ProviderCase(null, List.of(PaymentProvider.STRIPE)),
                new ProviderCase(List.of(), List.of()),
                new ProviderCase(List.of(PaymentProvider.STRIPE), List.of(PaymentProvider.STRIPE)),
                new ProviderCase(List.of(PaymentProvider.STRIPE, PaymentProvider.STRIPE), List.of(PaymentProvider.STRIPE)),
                new ProviderCase(List.of(PaymentProvider.STRIPE, PaymentProvider.PYNG), List.of(PaymentProvider.STRIPE)),
                new ProviderCase(List.of(PaymentProvider.PYNG, PaymentProvider.STRIPE), List.of(PaymentProvider.STRIPE)),
                new ProviderCase(List.of(PaymentProvider.PYNG), List.of()),
                new ProviderCase(Arrays.asList(null, PaymentProvider.PYNG), List.of()));

        try (MockedStatic<Users> users = mockStatic(Users.class);
                MockedStatic<Account> stripeAccounts = mockStatic(Account.class);
                MockedStatic<PyngService> pyng = mockStatic(PyngService.class)) {
            for (ProviderCase testCase : cases) {
                EventData event = event("event-1");
                event.setSupportedPaymentProviders(testCase.configured());

                assertEquals(testCase.expected(), load(event).events().get(0).supportedPaymentProviders());
                assertEquals(!testCase.expected().isEmpty(), PaymentProviderPolicy.supportsStripe(event));
            }
            users.verifyNoInteractions();
            stripeAccounts.verifyNoInteractions();
            pyng.verifyNoInteractions();
        }
        repository.verify(() -> EventsRepository.getActivePublicEventsByOrganiser(ORGANISER), times(cases.size()));
        repository.verifyNoMoreInteractions();
    }

    @Test
    public void normalizesOptionalFieldsWithoutInventingLegacyBookingTypes() {
        EventData missingTypes = event("missing-types");
        missingTypes.setEventTicketTypes(null);
        EventData emptyTypes = event("empty-types");
        emptyTypes.setEventTicketTypes(Map.of());
        for (EventData event : List.of(missingTypes, emptyTypes)) {
            event.setDescription(null);
            event.setLocation(null);
            event.setEventTags(null);
            event.setRegistrationDeadline(null);
            event.setMaxTicketsPerTransaction(null);
            event.setPaused(null);
            event.setPaymentsActive(null);
            event.setWaitlistEnabled(null);
            event.setBookingApprovalEnabled(null);
            event.setPrice(1500);
            event.setVacancy(5);
        }

        for (PartnerEvent event : load(missingTypes, emptyTypes).events()) {
            assertEquals("", event.description());
            assertEquals("", event.location());
            assertEquals(List.of(), event.eventTags());
            assertEquals(List.of(), event.ticketTypes());
            assertNull(event.image());
            assertNull(event.thumbnail());
            assertNull(event.registrationDeadline());
            assertNull(event.maxTicketsPerTransaction());
            assertFalse(event.paused());
            assertFalse(event.paymentsActive());
            assertFalse(event.waitlistEnabled());
            assertFalse(event.bookingApprovalEnabled());
        }
    }

    @Test
    public void returnsEveryRealTicketIdInDeterministicOrder() {
        EventData event = event("event-1");
        Map<String, EventTicketType> types = new LinkedHashMap<>();
        types.put("z", ticket("z", "Early Bird", 1200, 7));
        types.put("b", ticket("b", "Early Bird", 1500, 0));
        types.put("general", ticket("general", "General Admission", 2500, 4));
        types.put("a", ticket("a", "Early Bird", 1100, 2));
        event.setEventTicketTypes(types);

        List<PartnerTicketType> result = load(event).events().get(0).ticketTypes();

        assertEquals(List.of(
                new PartnerTicketType("general", "General Admission", 2500, false, 4),
                new PartnerTicketType("a", "Early Bird", 1100, false, 2),
                new PartnerTicketType("b", "Early Bird", 1500, true, 0),
                new PartnerTicketType("z", "Early Bird", 1200, false, 7)), result);
        for (PartnerTicketType advertised : result) {
            ResolvedEventTicketType checkoutType = EventTicketTypeService.resolvePublicById(event, advertised.id())
                    .orElseThrow();
            assertEquals(advertised.id(), checkoutType.getId());
            assertEquals(Integer.valueOf(advertised.priceCents()), checkoutType.getPrice());
        }
    }

    @Test
    public void hidesInventoryCountsButPreservesBinarySoldOutStatus() {
        EventData event = event("event-1");
        event.setHideVacancy(true);
        event.setEventTicketTypes(Map.of(
                "general", ticket("general", "General Admission", 0, -2),
                "standard", ticket("standard", "Standard", 2000, 6)));
        GetPartnerEventsResponse response = load(event);

        assertEquals(List.of(
                new PartnerTicketType("general", "General Admission", 0, true, null),
                new PartnerTicketType("standard", "Standard", 2000, false, null)),
                response.events().get(0).ticketTypes());
        JsonNode json = JavaUtils.objectMapper.valueToTree(response);
        for (JsonNode ticket : json.path("events").get(0).path("ticketTypes")) {
            assertTrue(ticket.has("vacancy"));
            assertTrue(ticket.get("vacancy").isNull());
        }
    }

    @Test
    public void rejectsAnInvalidRetainedEventInsteadOfReturningAPartialFeed() {
        List<Consumer<EventData>> invalidChanges = List.of(
                event -> event.setIsPrivate(true),
                event -> event.setIsPrivate(null),
                event -> event.setIsActive(false),
                event -> event.setIsActive(null),
                event -> event.setOrganiserId("another-organiser"),
                event -> event.setEventId(null),
                event -> event.setName(" "),
                event -> event.setEndDate(null),
                event -> event.setEndDate(NOW),
                event -> event.setMaxTicketsPerTransaction(0),
                event -> event.setEventTags(Arrays.asList("volleyball", null)));

        for (Consumer<EventData> change : invalidChanges) {
            EventData invalid = event("invalid-event");
            change.accept(invalid);
            assertInvalid(invalid);
        }
    }

    @Test
    public void rejectsMalformedOrUnwritablePersistedTicketTypes() {
        List<Consumer<EventTicketType>> invalidChanges = List.of(
                ticket -> ticket.setId(null),
                ticket -> ticket.setId(" "),
                ticket -> ticket.setName(null),
                ticket -> ticket.setName(" "),
                ticket -> ticket.setPrice(null),
                ticket -> ticket.setPrice(-1),
                ticket -> ticket.setVacancy(null));
        for (Consumer<EventTicketType> change : invalidChanges) {
            EventData invalid = event("invalid-event");
            change.accept(invalid.getEventTicketTypes().get("type-1"));
            assertFalse(EventTicketTypeService.resolvePublicById(invalid, "type-1").isPresent());
            assertInvalid(invalid);
        }
        EventData alias = event("alias");
        alias.setEventTicketTypes(Map.of("legacy-key", ticket("stored-id", "General Admission", 1000, 1)));
        assertFalse(EventTicketTypeService.resolvePublicById(alias, "legacy-key").isPresent());
        assertFalse(EventTicketTypeService.resolvePublicById(alias, "stored-id").isPresent());
        assertEquals("stored-id", EventTicketTypeService.resolveById(alias, "legacy-key").getId());
        assertEquals("stored-id", EventTicketTypeService.resolveById(alias, "stored-id").getId());
        assertInvalid(alias);
        for (char character : ".~*/[]".toCharArray()) {
            String id = "invalid" + character + "id";
            EventData invalid = event("invalid-path-id");
            invalid.setEventTicketTypes(Map.of(id, ticket(id, "General Admission", 1000, 1)));
            assertFalse(EventTicketTypeService.resolvePublicById(invalid, id).isPresent());
            assertInvalid(invalid);
        }
    }

    @Test
    public void publicTicketResolutionDoesNotInventMissingTicketTypes() {
        EventData event = event("event-1");
        assertFalse(EventTicketTypeService.resolvePublicById(null, "type-1").isPresent());
        for (String id : new String[] { null, "", " ", "missing" }) {
            assertFalse(EventTicketTypeService.resolvePublicById(event, id).isPresent());
        }
        event.setEventTicketTypes(null);
        assertFalse(EventTicketTypeService.resolvePublicById(event, "type-1").isPresent());
        event.setEventTicketTypes(Map.of());
        assertFalse(EventTicketTypeService.resolvePublicById(event, "type-1").isPresent());
        Map<String, EventTicketType> nullTicket = new LinkedHashMap<>();
        nullTicket.put("type-1", null);
        event.setEventTicketTypes(nullTicket);
        assertFalse(EventTicketTypeService.resolvePublicById(event, "type-1").isPresent());
        assertInvalid(event);
    }

    @Test
    public void preservesSyrioHealthyResponsesButPropagatesQueryFailures() {
        String syrioOrganiser = "tihrtHXNCKVkYpmJIVijKDWkkvq2";
        EventData first = event("first");
        first.setEventTicketTypes(null);
        first.setPrice(1500);
        first.setVacancy(5);
        EventData second = event("second");
        second.setStartDate(after(5400));
        EventData past = event("past");
        past.setStartDate(after(-1));
        repository.when(() -> EventsRepository.getActivePublicEventsByOrganiser(syrioOrganiser))
                .thenReturn(List.of(second, past, first));
        GetSyrioEventsHandler handler = new GetSyrioEventsHandler();

        List<EventData> result = handler.handle(new GetSyrioEventsRequest(), AuthContext.anonymous()).events();

        assertEquals(List.of(first, second), result);
        assertSame(first, result.get(0));
        assertEquals(Integer.valueOf(1500), result.get(0).getPrice());
        assertEquals(Integer.valueOf(5), result.get(0).getVacancy());
        IllegalStateException readFailure = new IllegalStateException("Firestore unavailable");
        repository.when(() -> EventsRepository.getActivePublicEventsByOrganiser(syrioOrganiser))
                .thenThrow(readFailure);
        try {
            handler.handle(new GetSyrioEventsRequest(), AuthContext.anonymous());
            fail("Expected the Syrio query failure to propagate");
        } catch (RuntimeException expected) {
            assertSame(readFailure, expected.getCause());
        }
    }

    private GetPartnerEventsResponse load(EventData... events) {
        repository.when(() -> EventsRepository.getActivePublicEventsByOrganiser(ORGANISER))
                .thenReturn(Arrays.asList(events));
        return EventsService.getPublicPartnerEventsByOrganiser(ORGANISER);
    }

    private void assertInvalid(EventData invalid) {
        try {
            load(event("valid-event"), invalid);
        } catch (IllegalStateException expected) {
            return;
        }
        fail("Expected invalid partner data to fail the whole feed");
    }

    private EventData event(String id) {
        EventData event = new EventData();
        event.setEventId(id);
        event.setOrganiserId(ORGANISER);
        event.setName("Public event");
        event.setIsActive(true);
        event.setIsPrivate(false);
        event.setStartDate(after(3600));
        event.setEndDate(after(7200));
        event.setRegistrationDeadline(after(1800));
        event.setPaymentsActive(true);
        event.setEventTicketTypes(Map.of("type-1", ticket("type-1", "General Admission", 2500, 4)));
        return event;
    }

    private EventTicketType ticket(String id, String name, int price, int vacancy) {
        EventTicketType ticket = new EventTicketType();
        ticket.setId(id);
        ticket.setName(name);
        ticket.setPrice(price);
        ticket.setVacancy(vacancy);
        ticket.setCapacity(10);
        return ticket;
    }

    private Timestamp after(long seconds) {
        return Timestamp.ofTimeSecondsAndNanos(NOW.getSeconds() + seconds, 0);
    }

    private Set<String> fieldNames(JsonNode node) {
        Set<String> names = new HashSet<>();
        node.fieldNames().forEachRemaining(names::add);
        return names;
    }

    private record ProviderCase(List<PaymentProvider> configured, List<PaymentProvider> expected) {}
}
