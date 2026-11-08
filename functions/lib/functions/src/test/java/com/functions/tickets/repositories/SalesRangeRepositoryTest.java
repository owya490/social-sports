package com.functions.tickets.repositories;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.firebase.services.FirebaseService;
import com.functions.tickets.models.Order;
import com.functions.tickets.models.Ticket;
import com.google.api.core.ApiFutures;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;

public class SalesRangeRepositoryTest {
    private MockedStatic<FirebaseService> firebase;
    private Firestore db;

    @Before
    public void setUp() {
        db = mock(Firestore.class);
        firebase = mockStatic(FirebaseService.class);
        firebase.when(FirebaseService::getFirestore).thenReturn(db);
    }

    @After
    public void tearDown() {
        firebase.close();
    }

    @Test
    public void ordersUseInclusiveDatePurchasedBounds() throws Exception {
        Order order = new Order();
        Timestamp start = Timestamp.parseTimestamp("2026-11-01T00:00:00Z");
        Timestamp end = Timestamp.parseTimestamp("2026-11-08T00:00:00Z");
        QueryDocumentSnapshot document = document("order-1", order);

        stubRange("Orders", "datePurchased", start, end, document);

        assertEquals(List.of(order), OrdersRepository.getOrdersPurchasedBetween(start, end));
        assertEquals("order-1", order.getOrderId());
    }

    @Test
    public void ticketsUseInclusivePurchaseDateBounds() throws Exception {
        Ticket ticket = new Ticket();
        Timestamp start = Timestamp.parseTimestamp("2026-11-01T00:00:00Z");
        Timestamp end = Timestamp.parseTimestamp("2026-11-08T00:00:00Z");
        QueryDocumentSnapshot document = document("ticket-1", ticket);

        stubRange("Tickets", "purchaseDate", start, end, document);

        assertEquals(List.of(ticket), TicketsRepository.getTicketsPurchasedBetween(start, end));
        assertEquals("ticket-1", ticket.getTicketId());
    }

    private void stubRange(String collection, String field, Timestamp start, Timestamp end,
            QueryDocumentSnapshot document) {
        CollectionReference events = mock(CollectionReference.class);
        Query lower = mock(Query.class);
        Query upper = mock(Query.class);
        Query ordered = mock(Query.class);
        QuerySnapshot snapshot = mock(QuerySnapshot.class);
        when(db.collection(collection)).thenReturn(events);
        when(events.whereGreaterThanOrEqualTo(field, start)).thenReturn(lower);
        when(lower.whereLessThanOrEqualTo(field, end)).thenReturn(upper);
        when(upper.orderBy(field)).thenReturn(ordered);
        when(ordered.get()).thenReturn(ApiFutures.immediateFuture(snapshot));
        when(snapshot.getDocuments()).thenReturn(List.of(document));
    }

    private QueryDocumentSnapshot document(String id, Object value) {
        QueryDocumentSnapshot document = mock(QueryDocumentSnapshot.class);
        when(document.getId()).thenReturn(id);
        if (value instanceof Order order) {
            when(document.toObject(Order.class)).thenReturn(order);
        } else {
            when(document.toObject(Ticket.class)).thenReturn((Ticket) value);
        }
        return document;
    }
}
