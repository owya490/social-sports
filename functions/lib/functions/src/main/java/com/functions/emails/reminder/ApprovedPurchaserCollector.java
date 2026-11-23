package com.functions.emails.reminder;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;

import com.functions.tickets.models.Order;
import com.functions.tickets.models.OrderAndTicketStatus;
import com.functions.tickets.models.Ticket;

/**
 * Builds reminder recipients from approved orders that still have an approved
 * ticket for the event. Orders and tickets are the source of attendance.
 */
public final class ApprovedPurchaserCollector {
    public interface Tickets {
        Optional<Ticket> find(String ticketId);
    }

    public List<ReminderPurchaser> collect(String eventId, List<Order> orders, Tickets tickets) {
        TreeMap<String, Set<String>> namesByEmail = new TreeMap<>();
        for (Order order : orders) {
            if (order == null || order.getStatus() != OrderAndTicketStatus.APPROVED) {
                continue;
            }
            if (!hasApprovedTicket(eventId, order, tickets)) {
                continue;
            }
            String email = order.getEmail();
            if (email == null || email.isBlank()) {
                continue;
            }
            String fullName = order.getFullName() == null ? "" : order.getFullName().strip();
            namesByEmail.computeIfAbsent(email, ignored -> new TreeSet<>())
                    .add(fullName.isEmpty() ? email : fullName);
        }

        List<ReminderPurchaser> purchasers = new ArrayList<>();
        namesByEmail.forEach((email, names) -> purchasers.add(new ReminderPurchaser(email, List.copyOf(names))));
        return purchasers;
    }

    private static boolean hasApprovedTicket(String eventId, Order order, Tickets tickets) {
        List<String> ticketIds = order.getTickets() == null ? List.of() : order.getTickets();
        for (String ticketId : ticketIds) {
            if (ticketId == null || ticketId.isBlank()) {
                continue;
            }
            Optional<Ticket> ticket = tickets.find(ticketId);
            if (ticket.isPresent()
                    && eventId.equals(ticket.get().getEventId())
                    && ticket.get().getStatus() == OrderAndTicketStatus.APPROVED) {
                return true;
            }
        }
        return false;
    }
}
