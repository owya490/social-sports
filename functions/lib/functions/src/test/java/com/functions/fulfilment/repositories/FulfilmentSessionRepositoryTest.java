package com.functions.fulfilment.repositories;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.firebase.services.FirebaseService;
import com.functions.fulfilment.models.fulfilmentSession.WaitlistFulfilmentSession;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;

public class FulfilmentSessionRepositoryTest {
    @Test
    public void transactionalCreateUsesTheSuppliedTransactionWithoutIndependentWrite() throws Exception {
        Firestore db = mock(Firestore.class);
        CollectionReference collection = mock(CollectionReference.class);
        DocumentReference document = mock(DocumentReference.class);
        Transaction transaction = mock(Transaction.class);
        WaitlistFulfilmentSession session = mock(WaitlistFulfilmentSession.class);
        when(db.collection(FirebaseService.CollectionPaths.FULFILMENT_SESSIONS_ROOT_PATH)).thenReturn(collection);
        when(collection.document("session-1")).thenReturn(document);
        when(document.getId()).thenReturn("session-1");
        try (MockedStatic<FirebaseService> firebase = mockStatic(FirebaseService.class)) {
            firebase.when(FirebaseService::getFirestore).thenReturn(db);
            assertEquals("session-1", FulfilmentSessionRepository.createFulfilmentSession(
                    "session-1", session, Optional.of(transaction)));
            verify(transaction).create(document, session);
            verify(document).getId();
            org.mockito.Mockito.verifyNoMoreInteractions(document);
            verifyNoInteractions(session);
        }
    }
}
