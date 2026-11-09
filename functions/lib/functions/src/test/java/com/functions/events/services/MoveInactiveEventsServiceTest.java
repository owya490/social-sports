package com.functions.events.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Handler;
import java.util.logging.Level;
import java.util.logging.LogRecord;
import java.util.logging.Logger;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.slf4j.helpers.MessageFormatter;

import com.google.api.core.ApiFutures;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.Transaction;

public class MoveInactiveEventsServiceTest {
    private static final LocalDate TODAY = LocalDate.of(2026, 10, 6);
    private static final Timestamp ENDED = timestamp("2026-10-01T10:00:00Z");
    private static final Timestamp FUTURE = timestamp("2026-10-13T10:00:00Z");
    private static final String SOURCE = "Events/Active/Public/event-1";
    private static final String DESTINATION = "Events/InActive/Public/event-1";
    private static final String OWNER = "Users/Active/Public/owner-1";

    private Firestore db;
    private Map<String, Map<String, Object>> documents;
    private List<QueryDocumentSnapshot> streamOverride;
    private RuntimeException commitFailure;
    private TransactionAnswer transactionAnswer;
    private List<String> reads;
    private Transaction committed;
    private List<LogRecord> logs;
    private Handler logHandler;

    @Before
    public void setUp() {
        db = mock(Firestore.class);
        documents = new LinkedHashMap<>();
        reads = new ArrayList<>();
        transactionAnswer = this::runOnce;
        when(db.collection(anyString())).thenAnswer(invocation -> collection(invocation.getArgument(0)));
        when(db.runTransaction(any(Transaction.Function.class))).thenAnswer(invocation -> {
            Transaction.Function<?> function = invocation.getArgument(0);
            return transactionAnswer.apply(function);
        });
        documents.put(SOURCE, eventData(ENDED, "owner-1"));
        documents.put(OWNER, Map.of("publicUpcomingOrganiserEvents", List.of("event-1", "event-2")));
        logs = new ArrayList<>();
        logHandler = new Handler() {
            @Override
            public void publish(LogRecord record) {
                logs.add(record);
            }

            @Override
            public void flush() {
            }

            @Override
            public void close() {
            }
        };
        logHandler.setLevel(Level.ALL);
        Logger logger = Logger.getLogger(MoveInactiveEventsService.class.getName());
        logger.setLevel(Level.ALL);
        logger.addHandler(logHandler);
    }

    @After
    public void tearDown() {
        Logger.getLogger(MoveInactiveEventsService.class.getName()).removeHandler(logHandler);
    }

    @Test
    public void publicMoveCommitsPreservedEventDeleteAndTargetedIndexRemoval() throws Exception {
        assertTrue(movePublic());

        ArgumentCaptor<DocumentReference> created = ArgumentCaptor.forClass(DocumentReference.class);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> createdData = ArgumentCaptor.forClass(Map.class);
        verify(committed).create(created.capture(), createdData.capture());
        assertEquals(DESTINATION, created.getValue().getPath());
        Map<String, Object> expected = eventData(ENDED, "owner-1");
        expected.put("isActive", false);
        assertEquals(expected, createdData.getValue());

        ArgumentCaptor<DocumentReference> deleted = ArgumentCaptor.forClass(DocumentReference.class);
        verify(committed).delete(deleted.capture());
        assertEquals(SOURCE, deleted.getValue().getPath());

        ArgumentCaptor<DocumentReference> updated = ArgumentCaptor.forClass(DocumentReference.class);
        ArgumentCaptor<Object> removal = ArgumentCaptor.forClass(Object.class);
        verify(committed).update(updated.capture(), eq("publicUpcomingOrganiserEvents"), removal.capture());
        assertEquals(OWNER, updated.getValue().getPath());
        assertEquals(FieldValue.arrayRemove("event-1"), removal.getValue());
    }

    @Test
    public void privateMoveNeverReadsOrWritesPublicOrganiser() throws Exception {
        documents.clear();
        documents.put("Events/Active/Private/event-1", eventData(ENDED, "owner-1"));

        assertTrue(MoveInactiveEventsService.moveEventInTransaction(
                db,
                reference("Events/Active/Private", "event-1"),
                reference("Events/InActive/Private", "event-1"),
                TODAY));

        assertEquals(List.of(
                "Events/Active/Private/event-1",
                "Events/InActive/Private/event-1"), reads);
        verify(committed, never()).update(any(DocumentReference.class), anyString(), any());
        verify(db, never()).collection("Users/Active/Public");
    }

    @Test
    public void staleStreamCandidateWithRenewedEndDateIsNotArchived() throws Exception {
        Map<String, Object> streamed = eventData(ENDED, "owner-1");
        documents.put(SOURCE, eventData(FUTURE, "owner-1"));
        streamOverride = List.of(queryDocument("Events/Active/Public", "event-1", streamed));

        MoveInactiveEventsService.archiveCollection(
                db, TODAY, "Events/Active/Public", "Events/InActive/Public");

        verify(committed, never()).create(any(DocumentReference.class), anyMap());
        verify(committed, never()).delete(any(DocumentReference.class));
        verify(committed, never()).update(any(DocumentReference.class), anyString(), any());
        assertTrue(infoMessages().isEmpty());
        assertTrue(errorMessages().isEmpty());
    }

    @Test
    public void indexRemovalUsesOrganiserFromTransactionSnapshot() throws Exception {
        Map<String, Object> streamed = eventData(ENDED, "owner-1");
        documents.put(SOURCE, eventData(ENDED, "owner-2"));
        documents.put("Users/Active/Public/owner-2", Map.of("publicUpcomingOrganiserEvents", List.of("event-1")));
        streamOverride = List.of(queryDocument("Events/Active/Public", "event-1", streamed));

        MoveInactiveEventsService.archiveCollection(
                db, TODAY, "Events/Active/Public", "Events/InActive/Public");

        ArgumentCaptor<DocumentReference> updated = ArgumentCaptor.forClass(DocumentReference.class);
        verify(committed).update(updated.capture(), eq("publicUpcomingOrganiserEvents"), any());
        assertEquals("Users/Active/Public/owner-2", updated.getValue().getPath());
    }

    @Test
    public void retryRereadsEndDateAndDropsPreviousAttemptWrites() throws Exception {
        transactionAnswer = function -> {
            Transaction first = newTransaction();
            function.updateCallback(first);
            documents.put(SOURCE, eventData(FUTURE, "owner-1"));
            Transaction second = newTransaction();
            Object result = function.updateCallback(second);
            verify(second, never()).create(any(DocumentReference.class), anyMap());
            verify(second, never()).delete(any(DocumentReference.class));
            committed = second;
            return ApiFutures.immediateFuture(result);
        };

        assertFalse(movePublic());
    }

    @Test
    public void missingSourceIsANoop() throws Exception {
        documents.remove(SOURCE);

        assertFalse(movePublic());
        verify(committed, never()).create(any(DocumentReference.class), anyMap());
    }

    @Test
    public void existingDestinationFailsBeforeAnyWriteIsCommitted() throws Exception {
        documents.put(DESTINATION, Map.of("endDate", ENDED, "vacancy", 5));

        try {
            movePublic();
            fail("expected existing inactive event to fail archival");
        } catch (EventArchivalException error) {
            assertTrue(error.getMessage().contains("already exists"));
        }

        verify(committed, never()).create(any(DocumentReference.class), anyMap());
        verify(committed, never()).delete(any(DocumentReference.class));
        assertEquals(5, documents.get(DESTINATION).get("vacancy"));
    }

    @Test
    public void deletedPublicOrganiserDoesNotPreventArchival() throws Exception {
        documents.remove(OWNER);

        assertTrue(movePublic());

        ArgumentCaptor<DocumentReference> created = ArgumentCaptor.forClass(DocumentReference.class);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> createdData = ArgumentCaptor.forClass(Map.class);
        verify(committed).create(created.capture(), createdData.capture());
        assertEquals(DESTINATION, created.getValue().getPath());
        Map<String, Object> expected = eventData(ENDED, "owner-1");
        expected.put("isActive", false);
        assertEquals(expected, createdData.getValue());
        ArgumentCaptor<DocumentReference> deleted = ArgumentCaptor.forClass(DocumentReference.class);
        verify(committed).delete(deleted.capture());
        assertEquals(SOURCE, deleted.getValue().getPath());
        verify(committed, never()).update(any(DocumentReference.class), anyString(), any());
    }

    @Test
    public void invalidOrganiserDataRollsBackWithoutPartialArchival() throws Exception {
        List<Case> cases = List.of(
                new Case(eventData(ENDED, ""), null, "organiserId"),
                new Case(eventData(ENDED, "nested/owner"), null, "organiserId"),
                new Case(eventData(ENDED, "owner-1"),
                        Map.of("publicUpcomingOrganiserEvents", "event-1"),
                        "ID list"));
        for (Case archivalCase : cases) {
            documents.clear();
            reads.clear();
            documents.put(SOURCE, archivalCase.event());
            if (archivalCase.owner() != null) {
                documents.put(OWNER, archivalCase.owner());
            }
            try {
                movePublic();
                fail("expected archival to fail for " + archivalCase.error());
            } catch (EventArchivalException error) {
                assertTrue(error.getMessage(), error.getMessage().contains(archivalCase.error()));
            }
            verify(committed, never()).create(any(DocumentReference.class), anyMap());
        }
    }

    @Test
    public void badEventDoesNotPreventLaterValidEventArchival() throws Exception {
        documents.clear();
        Map<String, Object> malformed = new HashMap<>();
        malformed.put("endDate", "not-a-timestamp");
        Map<String, Object> invalidOwner = eventData(ENDED, "nested/owner");
        documents.put("Events/Active/Public/malformed-event", malformed);
        documents.put("Events/Active/Public/bad-event", invalidOwner);
        documents.put(SOURCE, eventData(ENDED, "owner-1"));
        documents.put(OWNER, Map.of("publicUpcomingOrganiserEvents", List.of("event-1", "event-2")));

        MoveInactiveEventsService.archiveCollection(
                db, TODAY, "Events/Active/Public", "Events/InActive/Public");

        assertEquals(2, errorMessages().size());
        ArgumentCaptor<DocumentReference> created = ArgumentCaptor.forClass(DocumentReference.class);
        verify(committed).create(created.capture(), anyMap());
        assertEquals(DESTINATION, created.getValue().getPath());
        assertEquals(1, infoMessages().size());
    }

    @Test
    public void commitFailurePropagatesAndNeverLogsSuccess() throws Exception {
        streamOverride = List.of(queryDocument(
                "Events/Active/Public", "event-1", eventData(ENDED, "owner-1")));
        commitFailure = new IllegalStateException("Firestore failed");

        try {
            MoveInactiveEventsService.archiveCollection(
                    db, TODAY, "Events/Active/Public", "Events/InActive/Public");
            fail("expected the Firestore failure to propagate");
        } catch (IllegalStateException error) {
            assertEquals("Firestore failed", error.getMessage());
        }

        assertTrue(infoMessages().isEmpty());
        assertTrue(errorMessages().isEmpty());
    }

    @Test
    public void eligibilityUsesSydneyCalendarDayAcrossDst() {
        assertTrue(MoveInactiveEventsService.hasEnded(
                Map.of("endDate", timestamp("2026-10-04T12:59:00Z")), LocalDate.of(2026, 10, 5)));
        assertFalse(MoveInactiveEventsService.hasEnded(
                Map.of("endDate", timestamp("2026-10-04T13:00:00Z")), LocalDate.of(2026, 10, 5)));
        assertTrue(MoveInactiveEventsService.hasEnded(
                Map.of("endDate", timestamp("2026-07-05T13:59:00Z")), LocalDate.of(2026, 7, 6)));
        assertFalse(MoveInactiveEventsService.hasEnded(
                Map.of("endDate", timestamp("2026-07-05T14:00:00Z")), LocalDate.of(2026, 7, 6)));
    }

    @Test
    public void todayUsesSydneyCalendarDay() {
        assertEquals(LocalDate.of(2026, 10, 4),
                MoveInactiveEventsService.sydneyDate(Instant.parse("2026-10-04T12:30:00Z")));
        assertEquals(LocalDate.of(2026, 10, 5),
                MoveInactiveEventsService.sydneyDate(Instant.parse("2026-10-04T13:30:00Z")));
    }

    @Test
    public void malformedEndDatesAreDataErrors() {
        for (Object endDate : new Object[] {null, "2026-10-01", new Date(1_759_276_800_000L)}) {
            Map<String, Object> event = new HashMap<>();
            event.put("endDate", endDate);
            try {
                MoveInactiveEventsService.hasEnded(event, TODAY);
                fail("expected malformed endDate to fail: " + endDate);
            } catch (EventArchivalException error) {
                assertTrue(error.getMessage().contains("timezone-aware timestamp"));
            }
        }
        try {
            MoveInactiveEventsService.hasEnded(null, TODAY);
            fail("expected a missing event to fail");
        } catch (EventArchivalException error) {
            assertTrue(error.getMessage().contains("timezone-aware timestamp"));
        }
    }

    @Test
    public void scansPublicAndPrivateEventsAndReportsTheSydneyDate() throws Exception {
        documents.clear();
        documents.put("Events/Active/Private/event-1", eventData(ENDED, "owner-1"));
        documents.put(SOURCE, eventData(FUTURE, "owner-1"));

        String result = MoveInactiveEventsService.moveInactiveEvents(db, TODAY);

        assertEquals(
                "Moved all Public and Private Active Events which are past their end date to Inactive.",
                result);
        assertTrue(formatted(logs).stream().anyMatch(message -> message.contains("06/10/2026")));
        ArgumentCaptor<DocumentReference> created = ArgumentCaptor.forClass(DocumentReference.class);
        verify(committed).create(created.capture(), anyMap());
        assertEquals("Events/InActive/Private/event-1", created.getValue().getPath());
    }

    private boolean movePublic() throws Exception {
        return MoveInactiveEventsService.moveEventInTransaction(
                db,
                reference("Events/Active/Public", "event-1"),
                reference("Events/InActive/Public", "event-1"),
                TODAY);
    }

    private CollectionReference collection(String path) {
        CollectionReference collection = mock(CollectionReference.class);
        when(collection.getPath()).thenReturn(path);
        when(collection.document(anyString())).thenAnswer(invocation -> reference(path, invocation.getArgument(0)));
        when(collection.get()).thenAnswer(invocation -> ApiFutures.immediateFuture(query(path)));
        return collection;
    }

    private QuerySnapshot query(String collectionPath) {
        QuerySnapshot snapshot = mock(QuerySnapshot.class);
        if (streamOverride != null) {
            when(snapshot.getDocuments()).thenReturn(streamOverride);
            return snapshot;
        }
        List<QueryDocumentSnapshot> docs = new ArrayList<>();
        String prefix = collectionPath + "/";
        for (Map.Entry<String, Map<String, Object>> entry : documents.entrySet()) {
            if (!entry.getKey().startsWith(prefix)) {
                continue;
            }
            String id = entry.getKey().substring(prefix.length());
            if (id.isEmpty() || id.contains("/")) {
                continue;
            }
            docs.add(queryDocument(collectionPath, id, entry.getValue()));
        }
        when(snapshot.getDocuments()).thenReturn(docs);
        return snapshot;
    }

    private QueryDocumentSnapshot queryDocument(String collectionPath, String id, Map<String, Object> data) {
        QueryDocumentSnapshot doc = mock(QueryDocumentSnapshot.class);
        DocumentReference ref = reference(collectionPath, id);
        when(doc.getId()).thenReturn(id);
        when(doc.getData()).thenReturn(new HashMap<>(data));
        when(doc.getReference()).thenReturn(ref);
        return doc;
    }

    private DocumentReference reference(String collectionPath, String id) {
        DocumentReference ref = mock(DocumentReference.class);
        when(ref.getId()).thenReturn(id);
        when(ref.getPath()).thenReturn(collectionPath + "/" + id);
        CollectionReference parent = mock(CollectionReference.class);
        when(parent.getPath()).thenReturn(collectionPath);
        when(ref.getParent()).thenReturn(parent);
        return ref;
    }

    private Transaction newTransaction() throws Exception {
        Transaction transaction = mock(Transaction.class);
        when(transaction.get(any(DocumentReference.class))).thenAnswer(invocation -> {
            DocumentReference ref = invocation.getArgument(0);
            reads.add(ref.getPath());
            return ApiFutures.immediateFuture(snapshot(ref.getPath()));
        });
        return transaction;
    }

    private DocumentSnapshot snapshot(String path) {
        DocumentSnapshot snapshot = mock(DocumentSnapshot.class);
        Map<String, Object> data = documents.get(path);
        when(snapshot.exists()).thenReturn(data != null);
        when(snapshot.getData()).thenReturn(data == null ? null : new HashMap<>(data));
        return snapshot;
    }

    private com.google.api.core.ApiFuture<Object> runOnce(Transaction.Function<?> function) throws Exception {
        Transaction transaction = newTransaction();
        committed = transaction;
        try {
            Object result = function.updateCallback(transaction);
            if (commitFailure != null) {
                return ApiFutures.immediateFailedFuture(commitFailure);
            }
            return ApiFutures.immediateFuture(result);
        } catch (Exception failure) {
            return ApiFutures.immediateFailedFuture(failure);
        }
    }

    private List<String> infoMessages() {
        return formatted(logs.stream().filter(record -> record.getLevel().equals(Level.INFO)).toList());
    }

    private List<String> errorMessages() {
        return formatted(logs.stream().filter(record -> record.getLevel().equals(Level.SEVERE)).toList());
    }

    private static List<String> formatted(List<LogRecord> records) {
        List<String> messages = new ArrayList<>();
        for (LogRecord record : records) {
            messages.add(MessageFormatter.arrayFormat(record.getMessage(), record.getParameters()).getMessage());
        }
        return messages;
    }

    private static Map<String, Object> eventData(Timestamp endDate, String organiserId) {
        Map<String, Object> data = new HashMap<>();
        data.put("endDate", endDate);
        data.put("organiserId", organiserId);
        data.put("isActive", true);
        data.put("vacancy", 14);
        Map<String, Object> ticket = new HashMap<>();
        ticket.put("vacancy", 14);
        ticket.put("price", 1350);
        data.put("eventTicketTypes", Map.of("ticket-1", ticket));
        data.put("unknownField", Map.of("preserved", true));
        return data;
    }

    private static Timestamp timestamp(String instant) {
        Instant value = Instant.parse(instant);
        return Timestamp.ofTimeSecondsAndNanos(value.getEpochSecond(), value.getNano());
    }

    @FunctionalInterface
    private interface TransactionAnswer {
        com.google.api.core.ApiFuture<?> apply(Transaction.Function<?> function) throws Exception;
    }

    private record Case(Map<String, Object> event, Map<String, Object> owner, String error) {
    }
}
