package com.functions.fulfilment.repositories;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.concurrent.ExecutionException;

import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.firebase.services.FirebaseService;
import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;
import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSessionStatus;
import com.functions.fulfilment.models.fulfilmentSession.PyngMetadata;
import com.functions.fulfilment.models.fulfilmentSession.WaitlistFulfilmentSession;
import com.functions.fulfilment.payment.PaymentStatus;
import com.google.api.core.ApiFuture;
import com.google.api.gax.rpc.ApiException;
import com.google.api.gax.rpc.StatusCode;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
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

    @Test
    public void transactionalArchiveWritesTheSessionAndDeletesTheLiveDocument() throws Exception {
        Firestore db = mock(Firestore.class);
        CollectionReference live = mock(CollectionReference.class);
        CollectionReference archive = mock(CollectionReference.class);
        DocumentReference liveDocument = mock(DocumentReference.class);
        DocumentReference archiveDocument = mock(DocumentReference.class);
        Transaction transaction = mock(Transaction.class);
        FulfilmentSession session = mock(FulfilmentSession.class);
        when(session.getId()).thenReturn("session-1");
        when(db.collection(FirebaseService.CollectionPaths.FULFILMENT_SESSIONS_ROOT_PATH)).thenReturn(live);
        when(db.collection(FirebaseService.CollectionPaths.ARCHIVED_FULFILMENT_SESSIONS_ROOT_PATH)).thenReturn(archive);
        when(live.document("session-1")).thenReturn(liveDocument);
        when(archive.document("session-1")).thenReturn(archiveDocument);

        try (MockedStatic<FirebaseService> firebase = mockStatic(FirebaseService.class)) {
            firebase.when(FirebaseService::getFirestore).thenReturn(db);
            FulfilmentSessionRepository.archiveFulfilmentSession(session, transaction);
        }

        verify(transaction).set(archiveDocument, session);
        verify(transaction).delete(liveDocument);
    }

    @Test
    public void liveSessionIsReturnedWithoutReadingTheArchive() throws Exception {
        Firestore db = mock(Firestore.class);
        CollectionReference live = mock(CollectionReference.class);
        DocumentReference liveDocument = mock(DocumentReference.class);
        DocumentSnapshot liveSnapshot = mock(DocumentSnapshot.class);
        FulfilmentSession session = mock(FulfilmentSession.class);
        ApiFuture<DocumentSnapshot> liveFuture = futureOf(liveSnapshot);
        when(db.collection(FirebaseService.CollectionPaths.FULFILMENT_SESSIONS_ROOT_PATH)).thenReturn(live);
        when(live.document("session-1")).thenReturn(liveDocument);
        when(liveDocument.get()).thenReturn(liveFuture);
        when(liveSnapshot.exists()).thenReturn(true);

        try (MockedStatic<FirebaseService> firebase = mockStatic(FirebaseService.class);
                MockedStatic<FulfilmentSession> sessions = mockStatic(FulfilmentSession.class)) {
            firebase.when(FirebaseService::getFirestore).thenReturn(db);
            sessions.when(() -> FulfilmentSession.fromFirestore(liveSnapshot)).thenReturn(session);

            Optional<FulfilmentSession> found = FulfilmentSessionRepository.getFulfilmentSessionOrArchived("session-1");

            assertEquals(session, found.orElseThrow());
            verify(db, never()).collection(FirebaseService.CollectionPaths.ARCHIVED_FULFILMENT_SESSIONS_ROOT_PATH);
        }
    }

    @Test
    public void archivedSessionIsReadWhenTheLiveSessionIsGone() throws Exception {
        Firestore db = mock(Firestore.class);
        CollectionReference live = mock(CollectionReference.class);
        CollectionReference archive = mock(CollectionReference.class);
        DocumentReference liveDocument = mock(DocumentReference.class);
        DocumentReference archiveDocument = mock(DocumentReference.class);
        DocumentSnapshot liveSnapshot = mock(DocumentSnapshot.class);
        DocumentSnapshot archiveSnapshot = mock(DocumentSnapshot.class);
        FulfilmentSession session = mock(FulfilmentSession.class);
        ApiFuture<DocumentSnapshot> liveFuture = futureOf(liveSnapshot);
        ApiFuture<DocumentSnapshot> archiveFuture = futureOf(archiveSnapshot);
        when(db.collection(FirebaseService.CollectionPaths.FULFILMENT_SESSIONS_ROOT_PATH)).thenReturn(live);
        when(db.collection(FirebaseService.CollectionPaths.ARCHIVED_FULFILMENT_SESSIONS_ROOT_PATH)).thenReturn(archive);
        when(live.document("session-1")).thenReturn(liveDocument);
        when(archive.document("session-1")).thenReturn(archiveDocument);
        when(liveDocument.get()).thenReturn(liveFuture);
        when(archiveDocument.get()).thenReturn(archiveFuture);
        when(liveSnapshot.exists()).thenReturn(false);
        when(archiveSnapshot.exists()).thenReturn(true);

        try (MockedStatic<FirebaseService> firebase = mockStatic(FirebaseService.class);
                MockedStatic<FulfilmentSession> sessions = mockStatic(FulfilmentSession.class)) {
            firebase.when(FirebaseService::getFirestore).thenReturn(db);
            sessions.when(() -> FulfilmentSession.fromFirestore(archiveSnapshot)).thenReturn(session);

            Optional<FulfilmentSession> found = FulfilmentSessionRepository.getFulfilmentSessionOrArchived("session-1");

            assertEquals(session, found.orElseThrow());
            sessions.verify(() -> FulfilmentSession.fromFirestore(liveSnapshot), never());
        }
    }

    @Test
    public void pyngSettlementSkipsALiveSessionThatWasAlreadyArchived() throws Exception {
        Firestore db = mock(Firestore.class);
        DocumentReference liveDocument = liveSession(db, false);
        archivedSession(db, true);

        try (MockedStatic<FirebaseService> firebase = mockStatic(FirebaseService.class)) {
            firebase.when(FirebaseService::getFirestore).thenReturn(db);
            FulfilmentSessionRepository.updatePyngSettlement(
                    "session-1",
                    PyngMetadata.builder().status(PaymentStatus.SUCCEEDED).build(),
                    FulfilmentSessionStatus.COMPLETED);
        }

        verify(liveDocument, never()).update(org.mockito.ArgumentMatchers.<java.util.Map<String, Object>>any());
    }

    @Test
    public void pyngSettlementFailsWhenTheMissingLiveSessionIsNotArchived() throws Exception {
        Firestore db = mock(Firestore.class);
        liveSession(db, false);
        archivedSession(db, false);

        try (MockedStatic<FirebaseService> firebase = mockStatic(FirebaseService.class)) {
            firebase.when(FirebaseService::getFirestore).thenReturn(db);
            try {
                FulfilmentSessionRepository.updatePyngSettlement(
                        "session-1",
                        PyngMetadata.builder().status(PaymentStatus.SUCCEEDED).build(),
                        FulfilmentSessionStatus.COMPLETED);
                fail("missing session should fail settlement");
            } catch (Exception e) {
                assertTrue(e.getMessage().contains("ArchivedFulfilmentSessions"));
            }
        }
    }

    @Test
    public void pyngSettlementTreatsAMissingDocumentUpdateAsAlreadyArchived() throws Exception {
        Firestore db = mock(Firestore.class);
        DocumentReference liveDocument = liveSession(db, true);
        archivedSession(db, true);
        ApiFuture<com.google.cloud.firestore.WriteResult> write = failedFuture(notFound("No document to update"));
        when(liveDocument.update(org.mockito.ArgumentMatchers.<java.util.Map<String, Object>>any()))
                .thenReturn(write);

        try (MockedStatic<FirebaseService> firebase = mockStatic(FirebaseService.class)) {
            firebase.when(FirebaseService::getFirestore).thenReturn(db);
            FulfilmentSessionRepository.updatePyngSettlement(
                    "session-1",
                    PyngMetadata.builder().status(PaymentStatus.SUCCEEDED).build(),
                    FulfilmentSessionStatus.COMPLETED);
        }
    }

    @Test
    public void pyngSettlementFailsWhenAMissingDocumentUpdateIsNotArchived() throws Exception {
        Firestore db = mock(Firestore.class);
        DocumentReference liveDocument = liveSession(db, true);
        archivedSession(db, false);
        ApiFuture<com.google.cloud.firestore.WriteResult> write = failedFuture(notFound("No document to update"));
        when(liveDocument.update(org.mockito.ArgumentMatchers.<java.util.Map<String, Object>>any()))
                .thenReturn(write);

        try (MockedStatic<FirebaseService> firebase = mockStatic(FirebaseService.class)) {
            firebase.when(FirebaseService::getFirestore).thenReturn(db);
            try {
                FulfilmentSessionRepository.updatePyngSettlement(
                        "session-1",
                        PyngMetadata.builder().status(PaymentStatus.SUCCEEDED).build(),
                        FulfilmentSessionStatus.COMPLETED);
                fail("missing session should fail settlement");
            } catch (Exception e) {
                assertTrue(e.getMessage().contains("ArchivedFulfilmentSessions"));
            }
        }
    }

    private static DocumentReference liveSession(Firestore db, boolean exists) throws Exception {
        CollectionReference live = mock(CollectionReference.class);
        DocumentReference liveDocument = mock(DocumentReference.class);
        DocumentSnapshot snapshot = mock(DocumentSnapshot.class);
        ApiFuture<DocumentSnapshot> read = futureOf(snapshot);
        when(db.collection(FirebaseService.CollectionPaths.FULFILMENT_SESSIONS_ROOT_PATH)).thenReturn(live);
        when(live.document("session-1")).thenReturn(liveDocument);
        when(liveDocument.get()).thenReturn(read);
        when(snapshot.exists()).thenReturn(exists);
        return liveDocument;
    }

    private static void archivedSession(Firestore db, boolean exists) throws Exception {
        CollectionReference archive = mock(CollectionReference.class);
        DocumentReference archiveDocument = mock(DocumentReference.class);
        DocumentSnapshot snapshot = mock(DocumentSnapshot.class);
        ApiFuture<DocumentSnapshot> read = futureOf(snapshot);
        when(db.collection(FirebaseService.CollectionPaths.ARCHIVED_FULFILMENT_SESSIONS_ROOT_PATH))
                .thenReturn(archive);
        when(archive.document("session-1")).thenReturn(archiveDocument);
        when(archiveDocument.get()).thenReturn(read);
        when(snapshot.exists()).thenReturn(exists);
    }

    private static ApiFuture<DocumentSnapshot> futureOf(DocumentSnapshot snapshot) throws Exception {
        @SuppressWarnings("unchecked")
        ApiFuture<DocumentSnapshot> future = mock(ApiFuture.class);
        when(future.get()).thenReturn(snapshot);
        return future;
    }

    private static <T> ApiFuture<T> failedFuture(Exception error) throws Exception {
        @SuppressWarnings("unchecked")
        ApiFuture<T> future = mock(ApiFuture.class);
        when(future.get()).thenThrow(new ExecutionException(error));
        return future;
    }

    private static ApiException notFound(String message) {
        StatusCode status = new StatusCode() {
            @Override
            public StatusCode.Code getCode() {
                return StatusCode.Code.NOT_FOUND;
            }

            @Override
            public Object getTransportCode() {
                return null;
            }
        };
        return new ApiException(message, null, status, false);
    }
}
