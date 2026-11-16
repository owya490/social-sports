package com.functions.users.repositories;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Map;

import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.firebase.services.FirebaseService;
import com.functions.firebase.services.FirebaseService.CollectionPaths;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;

public class UserProvisioningRepositoryTest {
    @Test
    public void verifyReadsUseTheActiveUserCollections() throws Exception {
        Firestore db = mock(Firestore.class);
        CollectionReference users = mock(CollectionReference.class);
        DocumentReference active = mock(DocumentReference.class);
        CollectionReference publicUsers = mock(CollectionReference.class);
        CollectionReference privateUsers = mock(CollectionReference.class);
        CollectionReference metadataUsers = mock(CollectionReference.class);
        DocumentReference publicDoc = mock(DocumentReference.class);
        DocumentReference privateDoc = mock(DocumentReference.class);
        DocumentReference metadataDoc = mock(DocumentReference.class);
        DocumentSnapshot publicSnap = mock(DocumentSnapshot.class);
        DocumentSnapshot privateSnap = mock(DocumentSnapshot.class);
        DocumentSnapshot metadataSnap = mock(DocumentSnapshot.class);
        Transaction transaction = mock(Transaction.class);
        when(db.collection(CollectionPaths.USERS)).thenReturn(users);
        when(users.document(CollectionPaths.ACTIVE)).thenReturn(active);
        when(active.collection(CollectionPaths.PUBLIC)).thenReturn(publicUsers);
        when(active.collection(CollectionPaths.PRIVATE)).thenReturn(privateUsers);
        when(active.collection(CollectionPaths.METADATA)).thenReturn(metadataUsers);
        when(publicUsers.document("uid-1")).thenReturn(publicDoc);
        when(privateUsers.document("uid-1")).thenReturn(privateDoc);
        when(metadataUsers.document("uid-1")).thenReturn(metadataDoc);
        stubRead(transaction, publicDoc, publicSnap);
        stubRead(transaction, privateDoc, privateSnap);
        stubRead(transaction, metadataDoc, metadataSnap);

        try (MockedStatic<FirebaseService> firebase = mockStatic(FirebaseService.class)) {
            firebase.when(FirebaseService::getFirestore).thenReturn(db);

            assertEquals(publicSnap, UserProvisioningRepository.verifyPublicProfile(transaction, "uid-1"));
            assertEquals(privateSnap, UserProvisioningRepository.verifyPrivateProfile(transaction, "uid-1"));
            assertEquals(metadataSnap, UserProvisioningRepository.verifyMetadata(transaction, "uid-1"));
        }
    }

    @Test
    public void createWritesMissingPublicPrivateAndMetadataProfiles() {
        Transaction transaction = mock(Transaction.class);
        DocumentSnapshot publicProfile = snapshot(false);
        DocumentSnapshot privateProfile = snapshot(false);
        DocumentSnapshot metadata = snapshot(false);
        Map<String, Object> data = Map.of("userId", "uid-1");

        UserProvisioningRepository.createPublicProfile(transaction, publicProfile, data);
        UserProvisioningRepository.createPrivateProfile(transaction, privateProfile, data);
        UserProvisioningRepository.createMetadata(transaction, metadata, data);

        verify(transaction).set(publicProfile.getReference(), data);
        verify(transaction).set(privateProfile.getReference(), data);
        verify(transaction).set(metadata.getReference(), data);
    }

    @Test
    public void createLeavesTheTransactionAloneWhenTheProfileExists() {
        Transaction transaction = mock(Transaction.class);
        DocumentSnapshot existing = snapshot(true);

        UserProvisioningRepository.createPublicProfile(transaction, existing, Map.of("firstName", "Alex"));
        UserProvisioningRepository.createPrivateProfile(transaction, existing, Map.of("userId", "uid-1"));
        UserProvisioningRepository.createMetadata(transaction, existing, Map.of("userId", "uid-1"));

        verifyNoInteractions(transaction);
    }

    private static DocumentSnapshot snapshot(boolean exists) {
        DocumentSnapshot snapshot = mock(DocumentSnapshot.class);
        DocumentReference reference = mock(DocumentReference.class);
        when(snapshot.exists()).thenReturn(exists);
        when(snapshot.getReference()).thenReturn(reference);
        return snapshot;
    }

    @SuppressWarnings("unchecked")
    private static void stubRead(Transaction transaction, DocumentReference reference, DocumentSnapshot snapshot)
            throws Exception {
        ApiFuture<DocumentSnapshot> future = mock(ApiFuture.class);
        when(transaction.get(reference)).thenReturn(future);
        when(future.get()).thenReturn(snapshot);
    }
}
