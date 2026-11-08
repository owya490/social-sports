package com.functions.tickets.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;

import java.util.List;

import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.global.exceptions.AuthenticationException;
import com.functions.global.exceptions.AuthorizationException;
import com.functions.global.models.AuthContext;
import com.functions.global.models.requests.DateRangeRequest;
import com.functions.tickets.models.Order;
import com.functions.tickets.models.Ticket;
import com.functions.tickets.repositories.OrdersRepository;
import com.functions.tickets.repositories.TicketsRepository;
import com.google.cloud.Timestamp;

public class GetSalesInRangeHandlerTest {
    private static final String ALLOWED_ACCOUNT = "ZzuRS5v8hhWonnp2qdIOZG8R7f12";
    private static final Timestamp START = Timestamp.parseTimestamp("2026-11-01T00:00:00Z");
    private static final Timestamp END = Timestamp.parseTimestamp("2026-11-08T00:00:00Z");

    @Test(expected = AuthenticationException.class)
    public void requiresASignedInUser() {
        new GetSalesInRangeHandler().handle(new DateRangeRequest(START, END), AuthContext.anonymous());
    }

    @Test
    public void returnsOrdersAndTicketsInTheRange() {
        Order order = new Order();
        Ticket ticket = new Ticket();
        try (MockedStatic<OrdersRepository> orders = mockStatic(OrdersRepository.class);
                MockedStatic<TicketsRepository> tickets = mockStatic(TicketsRepository.class)) {
            orders.when(() -> OrdersRepository.getOrdersPurchasedBetween(START, END)).thenReturn(List.of(order));
            tickets.when(() -> TicketsRepository.getTicketsPurchasedBetween(START, END)).thenReturn(List.of(ticket));

            var response = new GetSalesInRangeHandler()
                    .handle(new DateRangeRequest(START, END), AuthContext.authenticated(ALLOWED_ACCOUNT));

            assertEquals(List.of(order), response.orders());
            assertEquals(List.of(ticket), response.tickets());
        }
    }

    @Test
    public void rejectsAnyOtherSignedInUserBeforeQuerying() {
        try (MockedStatic<OrdersRepository> orders = mockStatic(OrdersRepository.class);
                MockedStatic<TicketsRepository> tickets = mockStatic(TicketsRepository.class)) {
            try {
                new GetSalesInRangeHandler().handle(
                        new DateRangeRequest(START, END), AuthContext.authenticated("someone-else"));
                fail("Expected another account to be denied");
            } catch (AuthorizationException expected) {
                orders.verify(() -> OrdersRepository.getOrdersPurchasedBetween(START, END), never());
                tickets.verify(() -> TicketsRepository.getTicketsPurchasedBetween(START, END), never());
            }
        }
    }
}
