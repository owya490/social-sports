package com.functions.events.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;

import org.junit.Test;
import org.mockito.ArgumentCaptor;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Transaction;

public class CustomEventLinksServiceTest {
    @Test
    public void clearRecurrenceTemplateReferenceKeepsTheLinkAndItsEventButRemovesTheTemplatePointer() {
        DocumentSnapshot link = mock(DocumentSnapshot.class);
        DocumentReference linkRef = mock(DocumentReference.class);
        Transaction transaction = mock(Transaction.class);
        when(link.getReference()).thenReturn(linkRef);

        CustomEventLinksService.clearRecurrenceTemplateReference(List.of(link), transaction);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> updates = ArgumentCaptor.forClass(Map.class);
        verify(transaction).update(org.mockito.ArgumentMatchers.eq(linkRef), updates.capture());
        Map<String, Object> cleared = updates.getValue();
        assertEquals(2, cleared.size());
        assertTrue(cleared.get("referenceId") instanceof FieldValue);
        assertTrue(cleared.get("referenceName") instanceof FieldValue);
        assertFalse(cleared.containsKey("eventReference"));
        verifyNoInteractions(linkRef);
    }
}
