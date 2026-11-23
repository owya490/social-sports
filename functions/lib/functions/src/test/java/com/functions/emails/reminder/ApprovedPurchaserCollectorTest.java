package com.functions.emails.reminder;

import static org.junit.Assert.assertEquals;

import java.util.List;
import java.util.Optional;

import org.junit.Test;

import com.functions.tickets.models.Order;
import com.functions.tickets.models.OrderAndTicketStatus;
import com.functions.tickets.models.Ticket;

public class ApprovedPurchaserCollectorTest {
    @Test
    public void keepsOnePurchaserPerApprovedEmail() {
        ApprovedPurchaserCollector collector = new ApprovedPurchaserCollector();

        List<ReminderPurchaser> purchasers = collector.collect("event-1", List.of(
                order("bea@example.com", "Cara", OrderAndTicketStatus.APPROVED, "bea"),
                order("ada@example.com", "Bea", OrderAndTicketStatus.APPROVED, "ada-2"),
                order("ada@example.com", "Ada", OrderAndTicketStatus.APPROVED, "ada-1"),
                order("blank@example.com", "  ", OrderAndTicketStatus.APPROVED, "blank"),
                order("recovered@example.com", "Ree", OrderAndTicketStatus.APPROVED, "gone", "ok"),
                order("pending@example.com", "Pat", OrderAndTicketStatus.PENDING, "pending"),
                order("other@example.com", "Ora", OrderAndTicketStatus.APPROVED, "other"),
                order("rejected@example.com", "Rej", OrderAndTicketStatus.APPROVED, "rejected"),
                order(" ", "No Email", OrderAndTicketStatus.APPROVED, "no-email"),
                order("missing@example.com", "Mia", OrderAndTicketStatus.APPROVED, "gone")),
                this::ticket);

        assertEquals(List.of(
                new ReminderPurchaser("ada@example.com", List.of("Ada", "Bea")),
                new ReminderPurchaser("bea@example.com", List.of("Cara")),
                new ReminderPurchaser("blank@example.com", List.of("blank@example.com")),
                new ReminderPurchaser("recovered@example.com", List.of("Ree"))), purchasers);
    }

    private static Order order(String email, String fullName, OrderAndTicketStatus status, String... ticketIds) {
        Order order = new Order();
        order.setEmail(email);
        order.setFullName(fullName);
        order.setStatus(status);
        order.setTickets(List.of(ticketIds));
        return order;
    }

    private Optional<Ticket> ticket(String ticketId) {
        Ticket ticket = new Ticket();
        ticket.setStatus("rejected".equals(ticketId)
                ? OrderAndTicketStatus.REJECTED
                : OrderAndTicketStatus.APPROVED);
        ticket.setEventId("other".equals(ticketId) ? "event-2" : "event-1");
        return "gone".equals(ticketId) ? Optional.empty() : Optional.of(ticket);
    }
}
