package com.functions.emails.reminder;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mockStatic;

import java.util.List;
import java.util.Optional;

import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.events.models.EventMetadata;
import com.functions.events.repositories.EventsRepository;
import com.functions.tickets.models.Order;
import com.functions.tickets.models.OrderAndTicketStatus;
import com.functions.tickets.models.Ticket;
import com.functions.tickets.repositories.OrdersRepository;
import com.functions.tickets.repositories.TicketsRepository;

public class FirestoreApprovedPurchasersTest {
    private final FirestoreApprovedPurchasers purchasers =
            new FirestoreApprovedPurchasers(new ApprovedPurchaserCollector());

    @Test
    public void readsOrdersAndKeepsThePurchaserWhenAnEarlierTicketIsMissing() {
        EventMetadata metadata = new EventMetadata();
        metadata.setOrderIds(List.of("order-1", "missing-order"));
        Order order = new Order();
        order.setStatus(OrderAndTicketStatus.APPROVED);
        order.setEmail("ada@example.com");
        order.setFullName("Ada");
        order.setTickets(List.of("missing-ticket", "ticket-1"));
        Ticket ticket = new Ticket();
        ticket.setEventId("event-1");
        ticket.setStatus(OrderAndTicketStatus.APPROVED);

        try (MockedStatic<EventsRepository> events = mockStatic(EventsRepository.class);
                MockedStatic<OrdersRepository> orders = mockStatic(OrdersRepository.class);
                MockedStatic<TicketsRepository> tickets = mockStatic(TicketsRepository.class)) {
            events.when(() -> EventsRepository.getEventMetadataById("event-1")).thenReturn(Optional.of(metadata));
            orders.when(() -> OrdersRepository.getOrderById("order-1")).thenReturn(Optional.of(order));
            orders.when(() -> OrdersRepository.getOrderById("missing-order")).thenReturn(Optional.empty());
            tickets.when(() -> TicketsRepository.getTicketById("missing-ticket")).thenReturn(Optional.empty());
            tickets.when(() -> TicketsRepository.getTicketById("ticket-1")).thenReturn(Optional.of(ticket));

            assertEquals(List.of(new ReminderPurchaser("ada@example.com", List.of("Ada"))),
                    purchasers.forEvent("event-1"));
            tickets.verify(() -> TicketsRepository.getTicketById("ticket-1"));
        }
    }

    @Test
    public void returnsNoPurchasersWhenMetadataIsMissing() {
        try (MockedStatic<EventsRepository> events = mockStatic(EventsRepository.class);
                MockedStatic<OrdersRepository> orders = mockStatic(OrdersRepository.class)) {
            events.when(() -> EventsRepository.getEventMetadataById("event-1")).thenReturn(Optional.empty());

            assertTrue(purchasers.forEvent("event-1").isEmpty());
            orders.verifyNoInteractions();
        }
    }
}
