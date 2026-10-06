package com.functions.events.repositories;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.fail;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
import com.google.cloud.firestore.Transaction;

public class EventsRepositoryTest {
    private MockedStatic<FirebaseService> firebaseService;
    private ApiFuture<DocumentSnapshot> future;
    private DocumentSnapshot snapshot;
    private Firestore db;
    private DocumentReference eventRef;
    private DocumentReference privateEventRef;
    private DocumentSnapshot privateSnapshot;

    @Before
    @SuppressWarnings("unchecked")
    public void setUp() throws Exception {
        db = mock(Firestore.class);
        CollectionReference publicEvents = mock(CollectionReference.class);
        CollectionReference privateEvents = mock(CollectionReference.class);
        eventRef = mock(DocumentReference.class);
        privateEventRef = mock(DocumentReference.class);
        future = mock(ApiFuture.class);
        snapshot = mock(DocumentSnapshot.class);
        privateSnapshot = mock(DocumentSnapshot.class);

        firebaseService = org.mockito.Mockito.mockStatic(FirebaseService.class);
        firebaseService.when(FirebaseService::getFirestore).thenReturn(db);
        when(db.collection("Events/Active/Public")).thenReturn(publicEvents);
        when(db.collection("Events/Active/Private")).thenReturn(privateEvents);
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
    public void returnsEmptyForMissingActivePublicEvent() {
        when(snapshot.exists()).thenReturn(false);

        assertFalse(EventsRepository.getActivePublicEventById("event-1").isPresent());
    }

    @Test
    public void propagatesFirestoreReadFailure() throws Exception {
        ExecutionException readFailure = new ExecutionException(new RuntimeException("unavailable"));
        when(future.get()).thenThrow(readFailure);

        try {
            EventsRepository.getActivePublicEventById("event-1");
            fail("Expected Firestore read failure to propagate");
        } catch (IllegalStateException expected) {
            assertSame(readFailure, expected.getCause());
        }
    }

    @Test
    public void findsActivePrivateEventWhenPublicCopyIsMissing() {
        EventData event = new EventData();
        when(privateSnapshot.exists()).thenReturn(true);
        when(privateSnapshot.toObject(EventData.class)).thenReturn(event);

        assertSame(event, EventsRepository.getActiveEventById("event-1").get());
        assertEquals("event-1", event.getEventId());
    }

    @Test
    public void activeLookupDoesNotReadInactivePartitions() {
        assertFalse(EventsRepository.getActiveEventById("event-1").isPresent());

        verify(db, never()).collection("Events/InActive/Public");
        verify(db, never()).collection("Events/InActive/Private");
        verify(db, never()).document("Events/InActive/Public/event-1");
        verify(db, never()).document("Events/InActive/Private/event-1");
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
    public void transactionReadFailurePropagates() throws Exception {
        Transaction transaction = mock(Transaction.class);
        ExecutionException readFailure = new ExecutionException(new RuntimeException("unavailable"));
        when(transaction.get(eventRef)).thenReturn(future);
        when(future.get()).thenThrow(readFailure);

        try {
            EventsRepository.getActiveEventById("event-1", false, transaction);
            fail("Expected transaction read failure to propagate");
        } catch (IllegalStateException expected) {
            assertSame(readFailure, expected.getCause());
        }
    }

    @Test
    public void genericLookupStillReadsArchivedEvents() throws Exception {
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

        assertSame(archivedEvent, EventsRepository.getEventById("event-1", Optional.empty()).get());
        assertEquals("event-1", archivedEvent.getEventId());
    }
}
