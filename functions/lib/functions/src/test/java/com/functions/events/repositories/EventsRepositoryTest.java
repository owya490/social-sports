package com.functions.events.repositories;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.events.models.EventData;
import com.functions.firebase.services.FirebaseService;
import com.google.api.core.ApiFuture;
import com.google.api.core.ApiFutures;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.Transaction;

public class EventsRepositoryTest {
    private MockedStatic<FirebaseService> firebaseService;
    private ApiFuture<DocumentSnapshot> future;
    private DocumentSnapshot snapshot;
    private Firestore db;
    private DocumentReference eventRef;
    private DocumentReference privateEventRef;
    private DocumentSnapshot privateSnapshot;
    private CollectionReference publicEvents;
    private Query organiserQuery;
    private ApiFuture<QuerySnapshot> organiserFuture;
    private QuerySnapshot organiserSnapshot;

    @Before
    @SuppressWarnings("unchecked")
    public void setUp() throws Exception {
        db = mock(Firestore.class);
        publicEvents = mock(CollectionReference.class);
        CollectionReference privateEvents = mock(CollectionReference.class);
        CollectionReference events = mock(CollectionReference.class);
        DocumentReference activeEvents = mock(DocumentReference.class);
        eventRef = mock(DocumentReference.class);
        privateEventRef = mock(DocumentReference.class);
        future = mock(ApiFuture.class);
        snapshot = mock(DocumentSnapshot.class);
        privateSnapshot = mock(DocumentSnapshot.class);
        organiserQuery = mock(Query.class);
        organiserFuture = mock(ApiFuture.class);
        organiserSnapshot = mock(QuerySnapshot.class);

        firebaseService = org.mockito.Mockito.mockStatic(FirebaseService.class);
        firebaseService.when(FirebaseService::getFirestore).thenReturn(db);
        when(db.collection("Events/Active/Public")).thenReturn(publicEvents);
        when(db.collection("Events/Active/Private")).thenReturn(privateEvents);
        when(db.collection("Events")).thenReturn(events);
        when(events.document("Active")).thenReturn(activeEvents);
        when(activeEvents.collection("Public")).thenReturn(publicEvents);
        when(publicEvents.whereEqualTo("organiserId", "organiser-1")).thenReturn(organiserQuery);
        when(organiserQuery.get()).thenReturn(organiserFuture);
        when(organiserFuture.get()).thenReturn(organiserSnapshot);
        when(organiserSnapshot.getDocuments()).thenReturn(List.of());
        when(publicEvents.document("event-1")).thenReturn(eventRef);
        when(privateEvents.document("event-1")).thenReturn(privateEventRef);
        when(eventRef.get()).thenReturn(future);
        when(future.get()).thenReturn(snapshot);
        when(privateEventRef.get()).thenReturn(ApiFutures.immediateFuture(privateSnapshot));
    }

    @After
    public void tearDown() {
        if (firebaseService != null) {
            firebaseService.close();
        }
    }

    @Test
    public void readsActivePublicEvent() {
        EventData event = new EventData();
        when(snapshot.exists()).thenReturn(true);
        when(snapshot.toObject(EventData.class)).thenReturn(event);

        assertSame(event, EventsRepository.getActivePublicEventById("event-1").get());
        assertEquals("event-1", event.getEventId());
    }

    @Test
    public void propagatesFirestoreReadFailure() throws Exception {
        Transaction transaction = mock(Transaction.class);
        ExecutionException readFailure = new ExecutionException(new RuntimeException("unavailable"));
        when(transaction.get(eventRef)).thenReturn(future);
        when(future.get()).thenThrow(readFailure);
        when(organiserFuture.get()).thenThrow(readFailure);

        for (Runnable read : new Runnable[] {
                () -> EventsRepository.getActivePublicEventById("event-1"),
                () -> EventsRepository.getActiveEventById("event-1", false, transaction),
                () -> EventsRepository.getActivePublicEventsByOrganiser("organiser-1")
        }) {
            try {
                read.run();
                fail("Expected Firestore read failure to propagate");
            } catch (IllegalStateException expected) {
                assertSame(readFailure, expected.getCause());
            }
        }
    }

    @Test
    public void organiserQuerySelectsOnlyActivePublicEventsAndAssignsDocumentIds() {
        QueryDocumentSnapshot firstDocument = mock(QueryDocumentSnapshot.class);
        QueryDocumentSnapshot secondDocument = mock(QueryDocumentSnapshot.class);
        EventData firstEvent = new EventData();
        firstEvent.setEventId("stale-id");
        EventData secondEvent = new EventData();
        when(firstDocument.getId()).thenReturn("event-1");
        when(secondDocument.getId()).thenReturn("event-2");
        when(firstDocument.toObject(EventData.class)).thenReturn(firstEvent);
        when(secondDocument.toObject(EventData.class)).thenReturn(secondEvent);
        when(organiserSnapshot.getDocuments()).thenReturn(List.of(firstDocument, secondDocument));

        assertEquals(List.of(firstEvent, secondEvent), EventsRepository.getActivePublicEventsByOrganiser("organiser-1"));
        assertEquals("event-1", firstEvent.getEventId());
        assertEquals("event-2", secondEvent.getEventId());
        verify(db).collection("Events");
        verify(publicEvents).whereEqualTo("organiserId", "organiser-1");
        verify(organiserQuery).get();
        verifyNoMoreInteractions(db, publicEvents, organiserQuery);
    }

    @Test
    public void organiserQueryReturnsEmptyForSuccessfulEmptyResult() {
        assertEquals(List.of(), EventsRepository.getActivePublicEventsByOrganiser("organiser-1"));
    }

    @Test
    public void organiserQueryRestoresInterruptAndPropagatesFailure() throws Exception {
        InterruptedException interruption = new InterruptedException("interrupted");
        when(organiserFuture.get()).thenThrow(interruption);

        try {
            EventsRepository.getActivePublicEventsByOrganiser("organiser-1");
            fail("Expected interruption to propagate");
        } catch (IllegalStateException expected) {
            assertSame(interruption, expected.getCause());
            assertTrue(Thread.currentThread().isInterrupted());
        } finally {
            Thread.interrupted();
        }
    }

    @Test
    public void organiserQueryRejectsUnmappableDocumentsInsteadOfReturningPartialResults() {
        QueryDocumentSnapshot validDocument = mock(QueryDocumentSnapshot.class);
        QueryDocumentSnapshot invalidDocument = mock(QueryDocumentSnapshot.class);
        when(validDocument.getId()).thenReturn("event-1");
        when(validDocument.toObject(EventData.class)).thenReturn(new EventData());
        when(invalidDocument.getId()).thenReturn("invalid-event");
        when(invalidDocument.toObject(EventData.class)).thenReturn(null);
        when(organiserSnapshot.getDocuments()).thenReturn(List.of(validDocument, invalidDocument));

        try {
            EventsRepository.getActivePublicEventsByOrganiser("organiser-1");
            fail("Expected document mapping failure to propagate");
        } catch (IllegalStateException expected) {
            assertTrue(expected.getMessage().contains("invalid-event"));
        }
    }

    @Test
    public void privateEventsRequireTheBroaderActiveLookup() {
        EventData event = new EventData();
        when(privateSnapshot.exists()).thenReturn(true);
        when(privateSnapshot.toObject(EventData.class)).thenReturn(event);

        assertFalse(EventsRepository.getActivePublicEventById("event-1").isPresent());
        assertSame(event, EventsRepository.getActiveEventById("event-1").get());
        assertEquals("event-1", event.getEventId());
    }

    @Test
    public void transactionReadsOnlyRequestedActivePartition() throws Exception {
        Transaction transaction = mock(Transaction.class);
        EventData event = new EventData();
        when(transaction.get(privateEventRef)).thenReturn(ApiFutures.immediateFuture(privateSnapshot));
        when(privateSnapshot.exists()).thenReturn(true);
        when(privateSnapshot.toObject(EventData.class)).thenReturn(event);

        assertSame(event, EventsRepository.getActiveEventById("event-1", true, transaction).get());
        verify(transaction, never()).get(eventRef);
    }

    @Test
    public void archivedEventsRemainAvailableOnlyThroughGenericLookup() throws Exception {
        DocumentReference inactiveRef = mock(DocumentReference.class);
        DocumentSnapshot inactiveSnapshot = mock(DocumentSnapshot.class);
        EventData archivedEvent = new EventData();
        archivedEvent.setIsActive(false);
        when(db.document("Events/Active/Public/event-1")).thenReturn(eventRef);
        when(db.document("Events/Active/Private/event-1")).thenReturn(privateEventRef);
        when(db.document("Events/InActive/Public/event-1")).thenReturn(inactiveRef);
        when(inactiveRef.get()).thenReturn(ApiFutures.immediateFuture(inactiveSnapshot));
        when(inactiveSnapshot.exists()).thenReturn(true);
        when(inactiveSnapshot.toObject(EventData.class)).thenReturn(archivedEvent);

        assertFalse(EventsRepository.getActiveEventById("event-1").isPresent());
        verify(db, never()).collection("Events/InActive/Public");
        verify(db, never()).collection("Events/InActive/Private");
        verify(db, never()).document("Events/InActive/Public/event-1");
        verify(db, never()).document("Events/InActive/Private/event-1");

        assertSame(archivedEvent, EventsRepository.getEventById("event-1", Optional.empty()).get());
        assertEquals("event-1", archivedEvent.getEventId());
    }
}
