package com.functions.tickets.services;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventMetadata;
import com.functions.events.repositories.EventsRepository;
import com.functions.firebase.services.FirebaseService;
import com.functions.tickets.models.Order;
import com.functions.tickets.models.OrderAndTicketStatus;
import com.functions.tickets.models.Ticket;
import com.functions.tickets.models.requests.create.CreateOrderRequest;
import com.functions.tickets.models.responses.create.CreateOrderResponse;
import com.functions.tickets.repositories.OrdersRepository;
import com.functions.tickets.repositories.TicketsRepository;
import com.google.cloud.Timestamp;

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

    public static void updateOrderAndTicketStatus(String orderId, OrderAndTicketStatus orderAndTicketStatus)
            throws Exception {
        FirebaseService.createFirestoreTransaction(transaction -> {
            Order order = OrdersRepository.getOrderById(orderId, Optional.of(transaction))
                    .orElseThrow(() -> new RuntimeException("Order not found " + orderId));
            List<Ticket> tickets = TicketsRepository.getTicketsByIds(order.getTickets(), Optional.of(transaction));
            for (Ticket ticket : tickets) {
                ticket.setStatus(orderAndTicketStatus);
                TicketsRepository.updateTicket(ticket.getTicketId(), ticket, Optional.of(transaction));
            }
            order.setStatus(orderAndTicketStatus);
            OrdersRepository.updateOrder(orderId, order, Optional.of(transaction));
            return null;
        });
    }

    /**
     * Creates an order and its tickets atomically within a Firestore transaction.
     * Also appends the new orderId to the event metadata's orderIds list.
     *
     * @param request The create order request from the frontend
     * @return CreateOrderResponse containing the new orderId and ticketIds
     */
    public static CreateOrderResponse createOrderWithTickets(CreateOrderRequest request) throws Exception {
        logger.info("Creating order with {} tickets for eventId: {}", request.tickets().size(), request.eventId());

        return FirebaseService.createFirestoreTransaction(transaction -> {
            Timestamp now = Timestamp.now();
            OrderAndTicketStatus status = request.status() != null ? request.status() : OrderAndTicketStatus.PENDING;

            Order order = new Order();
            order.setEmail(request.email());
            order.setFullName(request.fullName());
            order.setPhone(request.phone());
            order.setStripePaymentIntentId(request.stripePaymentIntentId());
            order.setDatePurchased(now);
            order.setApplicationFees(0);
            order.setDiscounts(0);
            order.setStatus(status);

            List<String> ticketIds = new ArrayList<>();
            for (CreateOrderRequest.TicketInput ticketInput : request.tickets()) {
                Ticket ticket = new Ticket();
                ticket.setEventId(request.eventId());
                ticket.setPrice(ticketInput.price());
                ticket.setPurchaseDate(now);
                ticket.setStatus(status);
                ticket.setFormResponseId(ticketInput.formResponseId());

                String ticketId = TicketsRepository.createTicket(ticket, transaction);
                ticketIds.add(ticketId);
            }

            order.setTickets(ticketIds);
            String orderId = OrdersRepository.createOrder(order, request.eventId(), transaction);

            logger.info("Created order {} with {} tickets for eventId: {}", orderId, ticketIds.size(),
                    request.eventId());
            return new CreateOrderResponse(orderId, ticketIds);
        });
    }

    /**
     * Gets all orders and their tickets for a given event, using the event
     * metadata's orderIds.
     *
     * @param eventId The event ID
     * @return Map of Order -> List of Tickets
     */
    public static Map<Order, List<Ticket>> getOrdersAndTicketsByEventId(String eventId) {
        logger.info("Getting orders and tickets for eventId: {}", eventId);

        EventMetadata metadata = EventsRepository.getEventMetadataById(eventId)
                .orElseThrow(() -> new RuntimeException("Event metadata not found for eventId: " + eventId));

        List<String> orderIds = metadata.getOrderIds();
        if (orderIds == null || orderIds.isEmpty()) {
            return new LinkedHashMap<>();
        }

        return getOrdersAndTickets(orderIds);
    }
}
