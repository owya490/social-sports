package com.functions.partners.repositories;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.fail;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;

import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.firebase.services.FirebaseService;
import com.google.api.core.ApiFutures;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;

public class PartnerIntegrationRepositoryTest {
    @Test
    public void readsOnlyTheNamedPrivateRecordAndPropagatesMissingMalformedAndFailedReads() {
        Firestore firestore = mock(Firestore.class);
        CollectionReference collection = mock(CollectionReference.class);
        DocumentReference document = mock(DocumentReference.class);
        DocumentSnapshot snapshot = mock(DocumentSnapshot.class);
        when(firestore.collection("PartnerIntegrations")).thenReturn(collection);
        when(collection.document("partner-one")).thenReturn(document);
        when(document.get()).thenReturn(ApiFutures.immediateFuture(snapshot));

        try (MockedStatic<FirebaseService> firebase = mockStatic(FirebaseService.class)) {
            firebase.when(FirebaseService::getFirestore).thenReturn(firestore);
            when(snapshot.exists()).thenReturn(true);
            when(snapshot.getData()).thenReturn(Map.of("enabled", true, "organiserId", "owner-one",
                    "allowedOrigins", List.of("https://partner.example"), "keyDigests", List.of("0".repeat(64))));
            assertEquals("owner-one", PartnerIntegrationRepository.findById("partner-one").orElseThrow().organiserId());

            when(snapshot.exists()).thenReturn(false);
            assertFalse(PartnerIntegrationRepository.findById("partner-one").isPresent());
            when(snapshot.exists()).thenReturn(true);
            when(snapshot.getData()).thenReturn(Map.of("enabled", "true"));
            assertReadFails();
            when(document.get()).thenReturn(ApiFutures.immediateFailedFuture(new IllegalStateException("unavailable")));
            assertReadFails();

            verify(firestore, times(4)).collection("PartnerIntegrations");
            verify(collection, times(4)).document("partner-one");
            verify(document, times(4)).get();
        }
    }

    private void assertReadFails() {
        try {
            PartnerIntegrationRepository.findById("partner-one");
            fail("Expected partner configuration read failure");
        } catch (IllegalStateException expected) {
        }
    }
}
