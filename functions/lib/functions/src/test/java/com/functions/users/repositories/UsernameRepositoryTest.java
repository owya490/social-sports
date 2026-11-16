package com.functions.users.repositories;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Map;

import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.firebase.services.FirebaseService;
import com.functions.users.repositories.UsernameRepository.UsernameClaim;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;

public class UsernameRepositoryTest {
    @Test
    public void verifyUsername_marksANameTakenOnlyWhenAnotherUserOwnsIt() throws Exception {
        Firestore db = mock(Firestore.class);
        CollectionReference usernames = mock(CollectionReference.class);
        DocumentReference reference = mock(DocumentReference.class);
        DocumentSnapshot snapshot = mock(DocumentSnapshot.class);
        Transaction transaction = mock(Transaction.class);
        when(db.collection(FirebaseService.CollectionPaths.USERNAMES)).thenReturn(usernames);
        when(usernames.document("alexsmith")).thenReturn(reference);
        when(snapshot.exists()).thenReturn(true);
        when(snapshot.getString("userId")).thenReturn("other-user");
        stubRead(transaction, reference, snapshot);

        try (MockedStatic<FirebaseService> firebase = mockStatic(FirebaseService.class)) {
            firebase.when(FirebaseService::getFirestore).thenReturn(db);

            UsernameClaim takenBySomeoneElse = UsernameRepository.verifyUsername(transaction, "uid-1", "alexsmith");
            when(snapshot.getString("userId")).thenReturn("uid-1");
            UsernameClaim sameUser = UsernameRepository.verifyUsername(transaction, "uid-1", "alexsmith");
            when(snapshot.exists()).thenReturn(false);
            UsernameClaim freeName = UsernameRepository.verifyUsername(transaction, "uid-1", "alexsmith");

            assertTrue(takenBySomeoneElse.taken());
            assertFalse(sameUser.taken());
            assertFalse(freeName.taken());
            assertEquals("alexsmith", freeName.name());
            assertEquals(reference, freeName.reference());
        }
    }

    @Test
    public void createUsername_reservesAFreeNameAndLeavesAnExistingReservation() {
        Transaction transaction = mock(Transaction.class);
        DocumentReference reference = mock(DocumentReference.class);
        DocumentSnapshot missing = mock(DocumentSnapshot.class);
        DocumentSnapshot existing = mock(DocumentSnapshot.class);
        when(missing.exists()).thenReturn(false);
        when(existing.exists()).thenReturn(true);

        UsernameRepository.createUsername(transaction, new UsernameClaim("alexsmith", reference, missing, false),
                "uid-1");
        UsernameRepository.createUsername(transaction, new UsernameClaim("alexsmith", reference, existing, true),
                "uid-1");

        verify(transaction).set(reference, Map.of("userId", "uid-1"));
        org.mockito.Mockito.verifyNoMoreInteractions(transaction);
        verifyNoInteractions(reference);
    }

    @SuppressWarnings("unchecked")
    private static void stubRead(Transaction transaction, DocumentReference reference, DocumentSnapshot snapshot)
            throws Exception {
        ApiFuture<DocumentSnapshot> future = mock(ApiFuture.class);
        when(transaction.get(reference)).thenReturn(future);
        when(future.get()).thenReturn(snapshot);
    }
}
