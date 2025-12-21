package com.functions.tickets.services;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.tickets.models.Order;
import com.functions.tickets.models.Ticket;
import com.functions.tickets.repositories.OrdersRepository;
import com.functions.tickets.repositories.TicketsRepository;

/**
 * Service for ticket and order related operations.
 */
public class TicketsService {
    private static final Logger logger = LoggerFactory.getLogger(TicketsService.class);

    /**
     * Gets all orders and their tickets for the given order IDs.
     *
     * @param orderIds The list of order IDs from event metadata
     * @return Map of Order -> List of Tickets
     */
    public static Map<Order, List<Ticket>> getOrdersAndTickets(List<String> orderIds) {
        logger.info("Getting orders and tickets for {} orders", orderIds.size());

        Map<Order, List<Ticket>> orderTicketsMap = new LinkedHashMap<>();

        List<Order> orders = OrdersRepository.getOrdersByIds(orderIds);
        for (Order order : orders) {
            List<Ticket> tickets = TicketsRepository.getTicketsByIds(order.getTickets());
            orderTicketsMap.put(order, tickets);
        }

        return orderTicketsMap;
    }

    /**
     * Calculates the total number of tickets from orders.
     *
     * @param orderTicketsMap Map of Order -> List of Tickets
     * @return Total ticket count
     */
    public static int calculateTotalTicketCount(Map<Order, List<Ticket>> orderTicketsMap) {
        return orderTicketsMap.values().stream()
                .mapToInt(List::size)
                .sum();
    }

    /**
     * Calculates net sales from orders and their tickets (ticket prices minus
     * discounts).
     *
     * @param orderTicketsMap Map of Order -> List of Tickets
     * @return Net sales in cents
     */
    public static long calculateNetSales(Map<Order, List<Ticket>> orderTicketsMap) {
        long totalTicketSales = 0;
        long totalDiscounts = 0;

        for (Map.Entry<Order, List<Ticket>> entry : orderTicketsMap.entrySet()) {
            Order order = entry.getKey();
            List<Ticket> tickets = entry.getValue();

            for (Ticket ticket : tickets) {
                totalTicketSales += ticket.getPrice();
            }
            totalDiscounts += order.getDiscounts();
        }

        return totalTicketSales - totalDiscounts;
    }

    public static void updateOrderAndTicketStatus(String orderId, OrderAndTicketStatus orderAndTicketStatus) {
        Order order = OrdersRepository.getOrderById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found " + orderId));
        List<Ticket> tickets = TicketsRepository.getTicketsByIds(order.getTickets());
        for (Ticket ticket : tickets) {
            ticket.setStatus(orderAndTicketStatus);
            TicketsRepository.updateTicket(ticket.getTicketId(), ticket);
        }
        order.setStatus(orderAndTicketStatus);
        OrdersRepository.updateOrder(orderId, order);
    }
}
