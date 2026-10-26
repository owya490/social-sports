package com.functions.emails;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.Parameterized;
import org.mockito.MockedStatic;

import com.functions.utils.environment.Environment;
import com.functions.utils.environment.EnvironmentUtils;
import com.google.api.core.ApiFutures;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;

@RunWith(Parameterized.class)
public class EmailServiceTest {
    @Parameterized.Parameters(name = "{0}")
    public static Collection<Object[]> environments() {
        return Arrays.asList(new Object[][] {
                { Environment.PRODUCTION, "https://www.sportshub.net.au/event/event-123",
                        "https://www.sportshub.net.au/order/order-456" },
                { Environment.DEVELOPMENT, "http://localhost:3000/event/event-123",
                        "http://localhost:3000/order/order-456" }
        });
    }

    private final Environment environment;
    private final String eventUrl;
    private final String orderLink;
    private MockedStatic<EnvironmentUtils> environments;
    private Firestore db;
    private DocumentSnapshot event;
    private DocumentSnapshot order;

    public EmailServiceTest(Environment environment, String eventUrl, String orderLink) {
        this.environment = environment;
        this.eventUrl = eventUrl;
        this.orderLink = orderLink;
    }

    @Before
    public void setUp() {
        environments = mockStatic(EnvironmentUtils.class);
        environments.when(EnvironmentUtils::getEnvironment).thenReturn(environment);
        db = mock(Firestore.class);
        event = mock(DocumentSnapshot.class);
        order = mock(DocumentSnapshot.class);
        when(event.getId()).thenReturn("event-123");
        when(event.getString("name")).thenReturn("Social volleyball");
        when(event.getString("location")).thenReturn("Sports centre");
        when(event.getString("organiserId")).thenReturn("organiser-789");
        when(event.getString("eventLink")).thenReturn("https://organiser.example/contact");
        when(event.get("startDate")).thenReturn(Timestamp.parseTimestamp("2026-10-24T07:00:00Z"));
        when(event.get("endDate")).thenReturn(Timestamp.parseTimestamp("2026-10-24T09:00:00Z"));
        when(event.get("eventTicketTypes")).thenReturn(Map.of("standard", Map.of("price", 1250)));
        when(order.get("datePurchased")).thenReturn(Timestamp.parseTimestamp("2026-10-22T00:00:00Z"));
        when(order.get("tickets")).thenReturn(List.of("ticket-1", "ticket-2"));

        CollectionReference tickets = mock(CollectionReference.class);
        DocumentReference ticketReference = mock(DocumentReference.class);
        DocumentSnapshot ticket = mock(DocumentSnapshot.class);
        when(db.collection("Tickets")).thenReturn(tickets);
        when(tickets.document("ticket-1")).thenReturn(ticketReference);
        when(ticketReference.get()).thenReturn(ApiFutures.immediateFuture(ticket));
        when(ticket.exists()).thenReturn(true);
        when(ticket.getString("eventTicketTypeId")).thenReturn("standard");
    }

    @After
    public void tearDown() {
        if (environments != null) {
            environments.close();
        }
    }

    @Test
    public void purchaseVariablesIncludeEventDestinationAndPreserveOrderDetails() {
        assertEquals(Map.ofEntries(
                Map.entry("name", "Brian"),
                Map.entry("eventName", "Social volleyball"),
                Map.entry("eventUrl", eventUrl),
                Map.entry("orderId", "order-456"),
                Map.entry("orderLink", orderLink),
                Map.entry("datePurchased", "10/22/2026, 11:00"),
                Map.entry("quantity", "2"),
                Map.entry("price", "12.5"),
                Map.entry("startDate", "10/24/2026, 18:00"),
                Map.entry("endDate", "10/24/2026, 20:00"),
                Map.entry("location", "Sports centre")),
                EmailService.buildEmailVariables(db, event, order, "Brian", "order-456"));
    }

    @Test
    public void pendingVariablesIncludeEventDestinationAndPreserveOrganiserDetails() {
        Map<String, String> variables = EmailService.buildBookingPendingEmailVariables(
                db, event, order, "Brian", "order-456");

        assertEquals(Map.ofEntries(
                Map.entry("name", "Brian"),
                Map.entry("eventName", "Social volleyball"),
                Map.entry("eventUrl", eventUrl),
                Map.entry("organiserId", "organiser-789"),
                Map.entry("orderId", "order-456"),
                Map.entry("datePurchased", "10/22/2026, 11:00"),
                Map.entry("quantity", "2"),
                Map.entry("price", "12.5"),
                Map.entry("startDate", "10/24/2026, 18:00"),
                Map.entry("endDate", "10/24/2026, 20:00"),
                Map.entry("location", "Sports centre")), variables);

        when(event.getString("organiserId")).thenReturn(null);
        assertEquals("", EmailService.buildBookingPendingEmailVariables(
                db, event, order, "Brian", "order-456").get("organiserId"));
    }

    @Test
    public void approvedVariablesIncludeEventDestinationAndPreserveTicketCount() {
        assertEquals(Map.of(
                "name", "Brian",
                "eventName", "Social volleyball",
                "eventUrl", eventUrl,
                "orderId", "order-456",
                "ticketCount", "2"),
                EmailService.buildBookingApprovedEmailVariables(db, event, order, "Brian", "order-456"));
    }
}
