package com.functions.events.repositories;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.fail;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.concurrent.ExecutionException;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.events.models.EventData;
import com.functions.firebase.services.FirebaseService;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;

public class EventsRepositoryTest {
    private MockedStatic<FirebaseService> firebaseService;
    private ApiFuture<DocumentSnapshot> future;
    private DocumentSnapshot snapshot;

    @Before
    @SuppressWarnings("unchecked")
    public void setUp() throws Exception {
        Firestore db = mock(Firestore.class);
        CollectionReference events = mock(CollectionReference.class);
        DocumentReference active = mock(DocumentReference.class);
        CollectionReference publicEvents = mock(CollectionReference.class);
        DocumentReference eventRef = mock(DocumentReference.class);
        future = mock(ApiFuture.class);
        snapshot = mock(DocumentSnapshot.class);

        firebaseService = org.mockito.Mockito.mockStatic(FirebaseService.class);
        firebaseService.when(FirebaseService::getFirestore).thenReturn(db);
        when(db.collection("Events")).thenReturn(events);
        when(events.document("Active")).thenReturn(active);
        when(active.collection("Public")).thenReturn(publicEvents);
        when(publicEvents.document("event-1")).thenReturn(eventRef);
        when(eventRef.get()).thenReturn(future);
        when(future.get()).thenReturn(snapshot);
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
}
