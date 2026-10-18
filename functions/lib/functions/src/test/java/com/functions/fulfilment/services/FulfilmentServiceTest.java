package com.functions.fulfilment.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.isA;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.CALLS_REAL_METHODS;

import java.time.Instant;
import java.util.Map;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Consumer;
import java.util.Optional;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.events.models.EventData;
import com.functions.events.models.EventTicketType;
import com.functions.events.repositories.EventsRepository;
import com.functions.fulfilment.models.PaymentProvider;
import com.functions.fulfilment.models.FulfilmentInitialisationScope;
import com.functions.fulfilment.models.InitialisedFulfilmentSession;
import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;
import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntityType;
import com.functions.firebase.services.FirebaseService;
import com.functions.global.exceptions.NotFoundException;
import com.google.cloud.firestore.Transaction;
import com.functions.fulfilment.models.fulfilmentSession.WaitlistFulfilmentSession;
import com.functions.fulfilment.repositories.FulfilmentSessionRepository;
import com.functions.stripe.exceptions.CheckoutDateTimeException;
import com.functions.stripe.models.responses.CreateStripeCheckoutSessionResponse;
import com.functions.stripe.services.StripeService;
import com.functions.utils.environment.Environment;
import com.functions.utils.environment.EnvironmentUtils;
import com.google.cloud.Timestamp;

public class FulfilmentServiceTest {
    private static final FulfilmentInitialisationScope GUEST = new FulfilmentInitialisationScope.Guest();
    private static final FulfilmentInitialisationScope PARTNER = new FulfilmentInitialisationScope.PartnerPublic("organiser-1");
    private MockedStatic<EventsRepository> events;
    private MockedStatic<FulfilmentSessionRepository> sessions;
    private MockedStatic<StripeService> stripe;
    private MockedStatic<EnvironmentUtils> environment;

    @Before
    public void setUp() {
        events = mockStatic(EventsRepository.class);
        sessions = mockStatic(FulfilmentSessionRepository.class);
        stripe = mockStatic(StripeService.class);
        environment = mockStatic(EnvironmentUtils.class);
        environment.when(EnvironmentUtils::getEnvironment).thenReturn(Environment.DEVELOPMENT);
    }

    @After
    public void tearDown() {
        environment.close();
        stripe.close();
        sessions.close();
        events.close();
    }

    @Test
    public void rejectsMissingActiveEventBeforeConstructingSession() throws Exception {
        events.when(() -> EventsRepository.getActiveEventById("event-1")).thenReturn(Optional.empty());

        assertUnavailable();
        events.verify(() -> EventsRepository.getActiveEventById("event-1"));
        events.verifyNoMoreInteractions();
    }

    @Test
    public void rejectsExplicitlyInactiveEventBeforeClassifyingOrCreatingSession() throws Exception {
        EventData event = availableEvent(false);
        events.when(() -> EventsRepository.getActiveEventById("event-1")).thenReturn(Optional.of(event));

        assertUnavailable();
        events.verify(() -> EventsRepository.getActiveEventById("event-1"));
        events.verifyNoMoreInteractions();
    }

    @Test
    public void rejectsClosedRegistrationBeforeStartingWaitlistSession() throws Exception {
        EventData event = availableEvent(true);
        event.setRegistrationDeadline(Timestamp.ofTimeSecondsAndNanos(Instant.now().minusSeconds(60).getEpochSecond(), 0));
        events.when(() -> EventsRepository.getActiveEventById("event-1")).thenReturn(Optional.of(event));

        assertUnavailable();
    }

    @Test
    public void activeAndLegacyEventsClassifyUsingTheValidatedSnapshot() throws Exception {
        for (Boolean isActive : new Boolean[] { true, null }) {
            EventData event = availableEvent(isActive);

            events.when(() -> EventsRepository.getActiveEventById("event-1")).thenReturn(Optional.of(event));
            AtomicReference<FulfilmentSession> persisted = captureSession();
            InitialisedFulfilmentSession result = FulfilmentInitialisationService.initialise(
                    "event-1", 1, "ticket-1", PaymentProvider.STRIPE, GUEST);
            assertSame(event, persisted.get().getEventData());
            assertEquals(persisted.get().getFulfilmentEntityIds().get(0), result.firstFulfilmentEntityId());
        }
        sessions.verify(() -> FulfilmentSessionRepository.createFulfilmentSession(
                anyString(), isA(WaitlistFulfilmentSession.class), any()), times(2));
        events.verify(() -> EventsRepository.getEventById(anyString()), times(0));
        stripe.verifyNoInteractions();
    }

    @Test
    public void databaseFailureRemainsAnOperationalError() throws Exception {
        IllegalStateException failure = new IllegalStateException("Firestore unavailable");
        events.when(() -> EventsRepository.getActiveEventById("event-1")).thenThrow(failure);

        try {
            FulfilmentInitialisationService.initialise("event-1", 1, "ticket-1", PaymentProvider.STRIPE, GUEST);
            fail("Expected database failure");
        } catch (IllegalStateException expected) {
            assertSame(failure, expected);
        }
        sessions.verifyNoInteractions();
        stripe.verifyNoInteractions();
    }

    @Test
    public void partnerRejectsMissingScopeAndMalformedCanonicalTicketsBeforeEffects() throws Exception {
        List<Consumer<EventData>> invalid = List.of(
                event -> event.setOrganiserId("other-organiser"),
                event -> event.setIsPrivate(true),
                event -> event.setIsPrivate(null),
                event -> event.setIsActive(false),
                event -> event.setIsActive(null),
                event -> event.getEventTicketTypes().get("ticket-1").setId("other-ticket"),
                event -> event.getEventTicketTypes().get("ticket-1").setPrice(null),
                event -> event.getEventTicketTypes().get("ticket-1").setVacancy(null));
        for (Consumer<EventData> mutation : invalid) {
            EventData event = availableEvent(true);
            mutation.accept(event);
            events.when(() -> EventsRepository.getActivePublicEventById("event-1")).thenReturn(Optional.of(event));
            try {
                FulfilmentInitialisationService.initialise("event-1", 1, "ticket-1", PaymentProvider.STRIPE, PARTNER);
                fail("Expected unavailable partner event");
            } catch (NotFoundException expected) {
                assertEquals("Event is not available", expected.getMessage());
            }
        }
        events.when(() -> EventsRepository.getActivePublicEventById("event-1")).thenReturn(Optional.empty());
        try {
            FulfilmentInitialisationService.initialise("event-1", 1, "ticket-1", PaymentProvider.STRIPE, PARTNER);
            fail("Expected missing public event rejection");
        } catch (NotFoundException expected) {
            assertEquals("Event is not available", expected.getMessage());
        }
        events.verify(() -> EventsRepository.getActiveEventById(anyString()), times(0));
        events.verify(() -> EventsRepository.getEventById(anyString()), times(0));
        sessions.verifyNoInteractions();
        stripe.verifyNoInteractions();
    }

    @Test
    public void partnerPaidUnsupportedProviderRejectsButFreeWorkflowRemainsAvailable() throws Exception {
        EventData event = availableEvent(true);
        event.getEventTicketTypes().get("ticket-1").setVacancy(2);
        event.setSupportedPaymentProviders(List.of());
        events.when(() -> EventsRepository.getActivePublicEventById("event-1")).thenReturn(Optional.of(event));
        try {
            FulfilmentInitialisationService.initialise("event-1", 1, "ticket-1", PaymentProvider.STRIPE, PARTNER);
            fail("Expected unsupported paid booking rejection");
        } catch (IllegalArgumentException expected) {
            sessions.verifyNoInteractions();
            stripe.verifyNoInteractions();
        }
        event.getEventTicketTypes().get("ticket-1").setPrice(0);
        stubStripe();
        AtomicReference<FulfilmentSession> persisted = captureSession();
        FulfilmentInitialisationService.initialise("event-1", 1, "ticket-1", PaymentProvider.STRIPE, PARTNER);
        assertEquals(FulfilmentEntityType.STRIPE, firstEntity(persisted.get()));
    }

    @Test
    public void supportedPartnerWorkflowsReturnSavedFirstEntityWithoutSessionReadsOrStartHooks() throws Exception {
        stubStripe();
        AtomicReference<FulfilmentSession> persisted = captureSession();
        for (boolean approval : new boolean[] { false, true }) {
            for (boolean forms : new boolean[] { false, true }) {
                EventData event = availableEvent(true);
                event.setBookingApprovalEnabled(approval);
                event.getEventTicketTypes().get("ticket-1").setVacancy(2);
                if (forms) {
                    event.getEventTicketTypes().get("ticket-1").setFormId("form-1");
                }
                events.when(() -> EventsRepository.getActivePublicEventById("event-1")).thenReturn(Optional.of(event));
                InitialisedFulfilmentSession result = FulfilmentInitialisationService.initialise(
                        "event-1", 1, "ticket-1", PaymentProvider.STRIPE, PARTNER);
                FulfilmentSession saved = persisted.get();
                assertSame(event, saved.getEventData());
                assertEquals(saved.getFulfilmentEntityIds().get(0), result.firstFulfilmentEntityId());
                assertEquals(forms ? FulfilmentEntityType.FORMS
                        : approval ? FulfilmentEntityType.DELAYED_STRIPE : FulfilmentEntityType.STRIPE, firstEntity(saved));
                assertTrue(saved.getFulfilmentEntityMap().get(result.firstFulfilmentEntityId()).onStartHook().isEmpty());
            }
        }
        sessions.verify(() -> FulfilmentSessionRepository.getFulfilmentSession(anyString(), any()), times(0));
        events.verify(() -> EventsRepository.getEventById(anyString()), times(0));
    }

    @Test
    @SuppressWarnings("unchecked")
    public void partnerWaitlistRechecksAndCreatesInOneTransactionWithNoCapabilityResult() throws Exception {
        Instant initialTime = Instant.parse("2026-10-18T00:00:00Z");
        Instant deadline = initialTime.plusSeconds(60);
        AtomicReference<Instant> currentTime = new AtomicReference<>(initialTime);
        EventData event = availableEvent(true);
        event.setSupportedPaymentProviders(List.of());
        event.setPaymentsActive(false);
        event.setRegistrationDeadline(Timestamp.ofTimeSecondsAndNanos(deadline.getEpochSecond(), 0));
        EventData current = availableEvent(true);
        current.setRegistrationDeadline(event.getRegistrationDeadline());
        current.setPaymentsActive(false);
        current.getEventTicketTypes().get("ticket-1").setVacancy(3);
        events.when(() -> EventsRepository.getActivePublicEventById("event-1")).thenReturn(Optional.of(event));
        Transaction transaction = mock(Transaction.class);
        events.when(() -> EventsRepository.getActiveEventById("event-1", false, transaction))
                .thenReturn(Optional.of(current));
        AtomicReference<FulfilmentSession> persisted = captureSession();
        try (MockedStatic<FirebaseService> firebase = mockStatic(FirebaseService.class);
                MockedStatic<Instant> clock = mockStatic(Instant.class, CALLS_REAL_METHODS)) {
            clock.when(Instant::now).thenAnswer(invocation -> currentTime.get());
            firebase.when(() -> FirebaseService.createFirestoreTransaction(any(Transaction.Function.class)))
                    .thenAnswer(invocation -> {
                        Transaction.Function<?> callback = invocation.getArgument(0);
                        assertNull(callback.updateCallback(transaction));
                        currentTime.set(deadline.plusSeconds(1));
                        Object result = callback.updateCallback(transaction);
                        assertNull(result);
                        return result;
                    });
            InitialisedFulfilmentSession result = FulfilmentInitialisationService.initialise(
                    "event-1", 1, "ticket-1", PaymentProvider.STRIPE, PARTNER);
            FulfilmentSession saved = persisted.get();
            assertSame(event, saved.getEventData());
            assertEquals(FulfilmentEntityType.WAITLIST, firstEntity(saved));
            assertEquals(saved.getFulfilmentEntityIds().get(0), result.firstFulfilmentEntityId());
            assertTrue(saved.getFulfilmentEntityMap().get(result.firstFulfilmentEntityId()).onStartHook().isEmpty());
            sessions.verify(() -> FulfilmentSessionRepository.createFulfilmentSession(
                    result.fulfilmentSessionId(), saved, Optional.of(transaction)), times(2));
        }
        stripe.verifyNoInteractions();
    }

    @Test
    @SuppressWarnings("unchecked")
    public void partnerWaitlistScopeChangeCannotPersistSession() throws Exception {
        EventData event = availableEvent(true);
        events.when(() -> EventsRepository.getActivePublicEventById("event-1")).thenReturn(Optional.of(event));
        Transaction transaction = mock(Transaction.class);
        try (MockedStatic<FirebaseService> firebase = mockStatic(FirebaseService.class)) {
            firebase.when(() -> FirebaseService.createFirestoreTransaction(any(Transaction.Function.class)))
                    .thenAnswer(invocation -> ((Transaction.Function<?>) invocation.getArgument(0)).updateCallback(transaction));
            for (Consumer<EventData> mutation : List.<Consumer<EventData>>of(
                    current -> current.setOrganiserId("other-organiser"),
                    current -> current.setIsPrivate(true),
                    current -> current.setIsActive(false),
                    current -> current.setWaitlistEnabled(false),
                    current -> current.getEventTicketTypes().get("ticket-1").setId("changed-ticket"))) {
                EventData current = availableEvent(true);
                mutation.accept(current);
                events.when(() -> EventsRepository.getActiveEventById("event-1", false, transaction))
                        .thenReturn(Optional.of(current));
                try {
                    FulfilmentInitialisationService.initialise("event-1", 1, "ticket-1", PaymentProvider.STRIPE, PARTNER);
                    fail("Expected current scope rejection");
                } catch (NotFoundException expected) {
                    assertEquals("Event is not available", expected.getMessage());
                }
            }
        }
        sessions.verifyNoInteractions();
        stripe.verifyNoInteractions();
    }

    private void stubStripe() {
        var response = new CreateStripeCheckoutSessionResponse("https://checkout.test/session", "cs_test", "acct_test");
        stripe.when(() -> StripeService.getStripeCheckoutUrl(
                anyString(), anyBoolean(), anyInt(), any(), any(), anyString(), anyString(), anyString(), any()))
                .thenReturn(response);
        stripe.when(() -> StripeService.getDelayedStripeCheckoutUrl(
                anyString(), anyBoolean(), anyInt(), any(), any(), anyString(), anyString(), anyString(), any()))
                .thenReturn(response);
    }

    private AtomicReference<FulfilmentSession> captureSession() throws Exception {
        AtomicReference<FulfilmentSession> persisted = new AtomicReference<>();
        sessions.when(() -> FulfilmentSessionRepository.createFulfilmentSession(anyString(), any(), any()))
                .thenAnswer(invocation -> {
                    persisted.set(invocation.getArgument(1));
                    return invocation.getArgument(0);
                });
        return persisted;
    }

    private FulfilmentEntityType firstEntity(FulfilmentSession session) {
        return session.getFulfilmentEntityMap().get(session.getFulfilmentEntityIds().get(0)).getType();
    }

    private void assertUnavailable() throws Exception {
        try {
            FulfilmentInitialisationService.initialise("event-1", 1, "ticket-1", PaymentProvider.STRIPE, GUEST);
            fail("Expected unavailable event rejection");
        } catch (CheckoutDateTimeException expected) {
            sessions.verifyNoInteractions();
            stripe.verifyNoInteractions();
        }
    }

    private static EventData availableEvent(Boolean isActive) {
        EventTicketType ticket = new EventTicketType();
        ticket.setId("ticket-1");
        ticket.setName("General Admission");
        ticket.setPrice(1350);
        ticket.setCapacity(14);
        ticket.setVacancy(0);
        EventData event = new EventData();
        event.setEventId("event-1");
        event.setOrganiserId("organiser-1");
        event.setIsActive(isActive);
        event.setIsPrivate(false);
        event.setBookingApprovalEnabled(false);
        event.setPaymentsActive(true);
        event.setEndDate(Timestamp.ofTimeSecondsAndNanos(Instant.now().plusSeconds(3600).getEpochSecond(), 0));
        event.setRegistrationDeadline(event.getEndDate());
        event.setWaitlistEnabled(true);
        event.setEventTicketTypes(Map.of("ticket-1", ticket));
        return event;
    }
}
