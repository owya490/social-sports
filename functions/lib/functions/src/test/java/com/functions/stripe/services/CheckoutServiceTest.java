package com.functions.stripe.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.CALLS_REAL_METHODS;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import java.util.logging.Handler;
import java.util.logging.LogRecord;
import java.util.logging.Logger;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.events.models.EventData;
import com.functions.events.models.EventTicketType;
import com.functions.firebase.services.FirebaseService;
import com.functions.stripe.exceptions.CheckoutDateTimeException;
import com.functions.stripe.models.requests.CreateStripeCheckoutSessionRequest;
import com.functions.users.models.PrivateUserData;
import com.functions.users.services.Users;
import com.google.api.core.ApiFutures;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;
import com.stripe.model.Account;
import com.stripe.model.checkout.Session;
import com.stripe.net.RequestOptions;
import com.stripe.param.checkout.SessionCreateParams;
import com.stripe.param.checkout.SessionCreateParams.PaymentIntentData.CaptureMethod;

public class CheckoutServiceTest {
    private MockedStatic<FirebaseService> firebase;
    private MockedStatic<Users> users;
    private MockedStatic<Account> accounts;
    private MockedStatic<Session> stripeSessions;
    private Transaction transaction;
    private DocumentReference eventRef;
    private DocumentReference privateEventRef;
    private DocumentSnapshot snapshot;
    private EventData event;
    private PrivateUserData organiser;
    private Exception commitFailure;
    private List<String> logMessages;
    private Handler logHandler;

    @Before
    @SuppressWarnings("unchecked")
    public void setUp() throws Exception {
        Firestore db = mock(Firestore.class);
        CollectionReference events = mock(CollectionReference.class);
        CollectionReference privateEvents = mock(CollectionReference.class);
        CollectionReference activeUsers = mock(CollectionReference.class);
        DocumentReference activeUsersRef = mock(DocumentReference.class);
        CollectionReference organisers = mock(CollectionReference.class);
        eventRef = mock(DocumentReference.class);
        privateEventRef = mock(DocumentReference.class);
        snapshot = mock(DocumentSnapshot.class);
        transaction = mock(Transaction.class);
        event = availableEvent();
        firebase = mockStatic(FirebaseService.class, CALLS_REAL_METHODS);
        users = mockStatic(Users.class);
        accounts = mockStatic(Account.class);
        stripeSessions = mockStatic(Session.class);
        firebase.when(FirebaseService::getFirestore).thenReturn(db);
        when(db.collection("Events/Active/Public")).thenReturn(events);
        when(events.document("event-1")).thenReturn(eventRef);
        when(db.collection("Events/Active/Private")).thenReturn(privateEvents);
        when(privateEvents.document("event-1")).thenReturn(privateEventRef);
        when(db.collection("Users")).thenReturn(activeUsers);
        when(activeUsers.document("Active")).thenReturn(activeUsersRef);
        when(activeUsersRef.collection("Private")).thenReturn(organisers);
        when(organisers.document("organiser-1")).thenReturn(mock(DocumentReference.class));
        when(transaction.get(eventRef)).thenReturn(ApiFutures.immediateFuture(snapshot));
        when(transaction.get(privateEventRef)).thenReturn(ApiFutures.immediateFuture(snapshot));
        when(snapshot.exists()).thenReturn(true);
        when(snapshot.toObject(EventData.class)).thenReturn(event);
        when(db.runTransaction(any(Transaction.Function.class))).thenAnswer(invocation -> {
            Transaction.Function<?> callback = invocation.getArgument(0);
            try {
                Object result = callback.updateCallback(transaction);
                return commitFailure == null ? ApiFutures.immediateFuture(result) : ApiFutures.immediateFailedFuture(commitFailure);
            } catch (Exception failure) {
                return ApiFutures.immediateFailedFuture(failure);
            }
        });
        organiser = new PrivateUserData();
        organiser.setStripeAccount("acct_test");
        organiser.setStripeAccountActive(true);
        users.when(() -> Users.getPrivateUserDataById("organiser-1", Optional.of(transaction))).thenReturn(organiser);
        Session session = mock(Session.class);
        when(session.getId()).thenReturn("cs_test");
        when(session.getUrl()).thenReturn("https://checkout.test/session");
        stripeSessions.when(() -> Session.create(any(SessionCreateParams.class), any(RequestOptions.class))).thenReturn(session);
        logMessages = new ArrayList<>();
        logHandler = new Handler() {
            @Override
            public void publish(LogRecord record) { logMessages.add(record.getMessage()); }
            @Override
            public void flush() {}
            @Override
            public void close() {}
        };
        Logger.getLogger(CheckoutService.class.getName()).addHandler(logHandler);
    }

    @After
    public void tearDown() {
        Logger.getLogger(CheckoutService.class.getName()).removeHandler(logHandler);
        stripeSessions.close();
        accounts.close();
        users.close();
        firebase.close();
    }

    @Test
    public void rejectsArchivalBetweenInitializationAndReservationWithoutProviderCallsOrWrites() throws Exception {
        when(snapshot.exists()).thenReturn(false);

        assertUnavailableBeforeReservation();
    }

    @Test
    public void rejectsInactiveFlagBeforeReadingOrganiserOrWritingInventory() throws Exception {
        event.setIsActive(false);

        assertUnavailableBeforeReservation();
    }

    @Test
    public void rejectsDeadlineCrossedDuringOrganiserLookupBeforeReservingInventory() throws Exception {
        Instant initialTime = Instant.parse("2026-10-06T09:00:00Z");
        Instant deadline = initialTime.plusSeconds(60);
        Instant afterDeadline = deadline.plusSeconds(1);
        AtomicReference<Instant> currentTime = new AtomicReference<>(initialTime);
        event.setRegistrationDeadline(Timestamp.ofTimeSecondsAndNanos(deadline.getEpochSecond(), 0));
        event.setEndDate(Timestamp.ofTimeSecondsAndNanos(deadline.plusSeconds(3600).getEpochSecond(), 0));

        try (MockedStatic<Instant> clock = mockStatic(Instant.class, CALLS_REAL_METHODS)) {
            clock.when(Instant::now).thenAnswer(invocation -> currentTime.get());
            users.when(() -> Users.getPrivateUserDataById("organiser-1", Optional.of(transaction)))
                    .thenAnswer(invocation -> {
                        currentTime.set(afterDeadline);
                        return organiser;
                    });
            try {
                CheckoutService.createStripeCheckoutSession(request(false));
                fail("Expected registration deadline rejection before reservation");
            } catch (CheckoutDateTimeException expected) {
                users.verify(() -> Users.getPrivateUserDataById("organiser-1", Optional.of(transaction)));
                stripeSessions.verifyNoInteractions();
                verify(transaction).get(eventRef);
                verifyNoMoreInteractions(transaction);
            }
        }
    }

    @Test
    public void activeAndLegacyEventsReserveOnTheSameActiveReference() throws Exception {
        for (boolean isPrivate : new boolean[] { false, true }) {
            for (Boolean isActive : new Boolean[] { true, null }) {
                event.setIsActive(isActive);
                event.setIsPrivate(isPrivate);

                assertEquals("cs_test", CheckoutService.createStripeCheckoutSession(request(isPrivate)).stripeCheckoutSessionId());
            }
            DocumentReference expectedRef = isPrivate ? privateEventRef : eventRef;
            verify(transaction, times(2)).get(expectedRef);
            verify(transaction, times(2)).update(expectedRef, Map.of("eventTicketTypes.ticket-1.vacancy", 13));
        }
        stripeSessions.verify(() -> Session.create(any(SessionCreateParams.class), any(RequestOptions.class)), times(4));
    }

    @Test
    public void commitFailureCannotCreateStripeSessionOrLogReservationSuccess() throws Exception {
        commitFailure = new IOException("Firestore commit unavailable");

        try {
            CheckoutService.createStripeCheckoutSession(request(false));
            fail("Expected commit failure");
        } catch (IOException expected) {
            assertSame(commitFailure, expected);
        }
        stripeSessions.verifyNoInteractions();
        assertFalse(logMessages.stream().anyMatch(message -> message.startsWith("Reservation committed successfully")));
    }

    private void assertUnavailableBeforeReservation() throws Exception {
        try {
            CheckoutService.createStripeCheckoutSession(request(false));
            fail("Expected unavailable event rejection");
        } catch (CheckoutDateTimeException expected) {
            users.verifyNoInteractions();
            accounts.verifyNoInteractions();
            stripeSessions.verifyNoInteractions();
            verify(transaction).get(eventRef);
            verifyNoMoreInteractions(transaction);
        }
    }

    private static CreateStripeCheckoutSessionRequest request(boolean isPrivate) {
        return new CreateStripeCheckoutSessionRequest("event-1", isPrivate, 1, "https://example.test/cancel",
                "https://example.test/success", "fulfilment-1", "end-1", CaptureMethod.AUTOMATIC, "ticket-1");
    }

    private static EventData availableEvent() {
        EventTicketType ticket = new EventTicketType();
        ticket.setId("ticket-1");
        ticket.setName("General Admission");
        ticket.setPrice(1350);
        ticket.setCapacity(14);
        ticket.setVacancy(14);
        EventData event = new EventData();
        event.setEventId("event-1");
        event.setOrganiserId("organiser-1");
        event.setIsActive(true);
        event.setPaymentsActive(true);
        event.setEndDate(Timestamp.ofTimeSecondsAndNanos(Instant.now().plusSeconds(3600).getEpochSecond(), 0));
        event.setRegistrationDeadline(event.getEndDate());
        event.setEventTicketTypes(Map.of("ticket-1", ticket));
        return event;
    }
}
