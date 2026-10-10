package com.functions.fulfilment.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.isA;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.times;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.events.models.EventData;
import com.functions.events.models.EventTicketType;
import com.functions.events.repositories.EventsRepository;
import com.functions.fulfilment.models.fulfilmentSession.WaitlistFulfilmentSession;
import com.functions.fulfilment.repositories.FulfilmentSessionRepository;
import com.functions.stripe.exceptions.CheckoutDateTimeException;
import com.functions.stripe.models.responses.CreateStripeCheckoutSessionResponse;
import com.functions.stripe.services.StripeService;
import com.functions.utils.environment.Environment;
import com.functions.utils.environment.EnvironmentUtils;
import com.google.cloud.Timestamp;

public class FulfilmentServiceTest {
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
        stripe.when(() -> StripeService.getStripeCheckoutUrl(
                anyString(), anyBoolean(), anyInt(), any(), any(), anyString(), anyString(), anyString()))
                .thenReturn(new CreateStripeCheckoutSessionResponse("https://checkout.test/session", "cs_test", "acct_test"));
        for (Boolean isActive : new Boolean[] { true, null }) {
            EventData event = availableEvent(isActive);
            EventData laterEvent = availableEvent(isActive);
            laterEvent.getEventTicketTypes().get("ticket-1").setVacancy(1);
            events.when(() -> EventsRepository.getActiveEventById("event-1")).thenReturn(Optional.of(event));
            events.when(() -> EventsRepository.getEventById("event-1")).thenReturn(Optional.of(laterEvent));
            sessions.when(() -> FulfilmentSessionRepository.createFulfilmentSession(anyString(), any()))
                    .thenReturn("session-1");

            assertEquals("session-1", FulfilmentService.initFulfilmentSession("event-1", 1, "ticket-1"));
        }
        sessions.verify(() -> FulfilmentSessionRepository.createFulfilmentSession(
                anyString(), isA(WaitlistFulfilmentSession.class)), times(2));
        stripe.verifyNoInteractions();
    }

    @Test
    public void databaseFailureRemainsAnOperationalError() throws Exception {
        IllegalStateException failure = new IllegalStateException("Firestore unavailable");
        events.when(() -> EventsRepository.getActiveEventById("event-1")).thenThrow(failure);

        try {
            FulfilmentService.initFulfilmentSession("event-1", 1, "ticket-1");
            fail("Expected database failure");
        } catch (IllegalStateException expected) {
            assertSame(failure, expected);
        }
        sessions.verifyNoInteractions();
        stripe.verifyNoInteractions();
    }

    private void assertUnavailable() throws Exception {
        try {
            FulfilmentService.initFulfilmentSession("event-1", 1, "ticket-1");
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
        event.setIsActive(isActive);
        event.setIsPrivate(false);
        event.setBookingApprovalEnabled(false);
        event.setEndDate(Timestamp.ofTimeSecondsAndNanos(Instant.now().plusSeconds(3600).getEpochSecond(), 0));
        event.setRegistrationDeadline(event.getEndDate());
        event.setWaitlistEnabled(true);
        event.setEventTicketTypes(Map.of("ticket-1", ticket));
        return event;
    }
}
