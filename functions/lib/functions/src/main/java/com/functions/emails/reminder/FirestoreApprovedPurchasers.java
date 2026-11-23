package com.functions.emails.reminder;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.emails.reminder.EmailReminderService.PurchaserSource;
import com.functions.events.models.EventMetadata;
import com.functions.events.repositories.EventsRepository;
import com.functions.tickets.models.Order;
import com.functions.tickets.models.Ticket;
import com.functions.tickets.repositories.OrdersRepository;
import com.functions.tickets.repositories.TicketsRepository;

final class FirestoreApprovedPurchasers implements PurchaserSource {
    private static final Logger logger = LoggerFactory.getLogger(FirestoreApprovedPurchasers.class);

    private final ApprovedPurchaserCollector collector;

    FirestoreApprovedPurchasers(ApprovedPurchaserCollector collector) {
        this.collector = collector;
    }

    @Override
    public List<ReminderPurchaser> forEvent(String eventId) {
        try {
            Optional<EventMetadata> metadata = EventsRepository.getEventMetadataById(eventId);
            if (metadata.isEmpty()) {
                logger.warn("Event metadata missing. eventId={}", eventId);
                return List.of();
            }

            List<String> orderIds = metadata.get().getOrderIds();
            if (orderIds == null || orderIds.isEmpty()) {
                return List.of();
            }

            List<Order> orders = new ArrayList<>();
            for (String orderId : orderIds) {
                Optional<Order> order = OrdersRepository.getOrderById(orderId);
                if (order.isEmpty()) {
                    logger.warn(
                            "Order missing while collecting reminder attendees. eventId={} orderId={}",
                            eventId,
                            orderId);
                    continue;
                }
                orders.add(order.get());
            }

            return collector.collect(eventId, orders, ticketId -> {
                Optional<Ticket> ticket = TicketsRepository.getTicketById(ticketId);
                if (ticket.isEmpty()) {
                    logger.warn(
                            "Ticket missing while collecting reminder attendees. eventId={} ticketId={}",
                            eventId,
                            ticketId);
                }
                return ticket;
            });
        } catch (RuntimeException e) {
            logger.error("Error getting reminder purchasers. eventId={}", eventId, e);
            return List.of();
        }
    }
}
