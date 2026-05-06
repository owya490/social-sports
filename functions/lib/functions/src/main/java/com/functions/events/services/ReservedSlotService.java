package com.functions.events.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventData;
import com.functions.events.models.ReservedSlot;
import com.functions.events.repositories.EventsRepository;
import com.functions.tickets.models.Order;
import com.functions.tickets.models.OrderAndTicketStatus;
import com.functions.tickets.models.OrderAndTicketType;
import com.functions.tickets.models.Ticket;
import com.functions.tickets.repositories.OrdersRepository;
import com.functions.tickets.repositories.TicketsRepository;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Transaction;

public class ReservedSlotService {
    private static final Logger logger = LoggerFactory.getLogger(ReservedSlotService.class);

    /**
     * Processes reserved slots for an event: validates, caps to capacity, reduces vacancy,
     * and creates Orders and Tickets for each slot. All operations happen in one transaction.
     *
     * @param eventId The event ID
     * @param rawReservedSlots The raw reserved slots to process
     * @param transaction The Firestore transaction
     */
    public static void processReservedSlots(String eventId, List<ReservedSlot> rawReservedSlots, Transaction transaction) throws Exception {
        if (rawReservedSlots == null || rawReservedSlots.isEmpty()) {
            return;
        }

        // Read event data - IMPORTANT: All reads must happen before any writes in Firestore transactions
        Optional<EventData> eventDataOpt = EventsRepository.getEventById(eventId, Optional.of(transaction));
        if (eventDataOpt.isEmpty()) {
            throw new Exception("Event not found for eventId: " + eventId);
        }
        EventData eventData = eventDataOpt.get();
        int currentVacancy = eventData.getVacancy();

        // Validate and normalize reserved slots
        List<ReservedSlot> reservedSlots = rawReservedSlots.stream()
                .filter(slot -> slot != null)
                .filter(slot -> slot.getSlots() != null && slot.getSlots() > 0)
                .filter(slot -> slot.getEmail() != null && !slot.getEmail().trim().isEmpty())
                .filter(slot -> slot.getName() != null && !slot.getName().trim().isEmpty())
                .collect(Collectors.toList());

        if (reservedSlots.isEmpty()) {
            return;
        }

        int totalReservedSlots = reservedSlots.stream().mapToInt(ReservedSlot::getSlots).sum();

        // Cap reserved slots to available capacity if needed
        if (totalReservedSlots > currentVacancy) {
            logger.warn("Reserved slots ({}) exceed vacancy ({}). Capping to available capacity.",
                    totalReservedSlots, currentVacancy);
            reservedSlots = capReservedSlotsToCapacity(reservedSlots, currentVacancy);
            totalReservedSlots = reservedSlots.stream().mapToInt(ReservedSlot::getSlots).sum();
        }

        // Update event vacancy
        int newVacancy = currentVacancy - totalReservedSlots;
        EventsRepository.updateEventById(eventId, "vacancy", newVacancy, transaction);
        logger.info("Reduced vacancy from {} to {} for event {}", currentVacancy, newVacancy, eventId);

        // Create Order and Tickets for each reserved slot
        int totalTicketsAdded = 0;
        Timestamp now = Timestamp.now();
        DocumentReference metadataRef = EventsRepository.getEventMetadataDocumentReference(eventId);

        for (ReservedSlot reservedSlot : reservedSlots) {
            String email = reservedSlot.getEmail().toLowerCase().trim();
            String name = reservedSlot.getName().trim();
            int slots = reservedSlot.getSlots();

            String orderId = OrdersRepository.generateOrderId();

            Order order = new Order();
            order.setEmail(email);
            order.setFullName(name);
            order.setPhone("");
            order.setStripePaymentIntentId("");
            order.setDatePurchased(now);
            order.setApplicationFees(0);
            order.setDiscounts(0);
            order.setStatus(OrderAndTicketStatus.APPROVED);
            order.setType(OrderAndTicketType.MANUAL);

            List<String> ticketIds = new ArrayList<>();
            for (int i = 0; i < slots; i++) {
                Ticket ticket = new Ticket();
                ticket.setEventId(eventId);
                ticket.setOrderId(orderId);
                ticket.setPrice(0);
                ticket.setPurchaseDate(now);
                ticket.setStatus(OrderAndTicketStatus.APPROVED);
                ticket.setType(OrderAndTicketType.MANUAL);

                String ticketId = TicketsRepository.createTicket(ticket, transaction);
                ticketIds.add(ticketId);
            }

            order.setTickets(ticketIds);
            OrdersRepository.createOrder(order, eventId, orderId, transaction);

            totalTicketsAdded += slots;
            logger.info("Created order {} with {} tickets for reserved slot: email={}, name={}", orderId, slots, email, name);
        }

        // Increment completeTicketCount
        transaction.update(metadataRef, "completeTicketCount", FieldValue.increment(totalTicketsAdded));

        logger.info("Successfully processed {} reserved slots ({} tickets) for event {}",
                reservedSlots.size(), totalTicketsAdded, eventId);
    }

    /**
     * Caps reserved slots to fit within the available capacity.
     * Processes slots in order, reducing or skipping slots that would exceed capacity.
     */
    public static List<ReservedSlot> capReservedSlotsToCapacity(List<ReservedSlot> reservedSlots, int maxCapacity) {
        List<ReservedSlot> cappedSlots = new ArrayList<>();
        int remainingCapacity = Math.max(0, maxCapacity);

        for (ReservedSlot slot : reservedSlots) {
            if (slot == null || slot.getSlots() == null || slot.getSlots() <= 0) {
                continue;
            }

            if (remainingCapacity <= 0) {
                logger.warn("Skipping reserved slot for {} - no capacity remaining", slot.getEmail());
                break;
            }

            int slotsToAdd = Math.min(slot.getSlots(), remainingCapacity);
            if (slotsToAdd < slot.getSlots()) {
                logger.warn("Reducing reserved slots for {} from {} to {} due to capacity limit",
                        slot.getEmail(), slot.getSlots(), slotsToAdd);
            }

            ReservedSlot cappedSlot = new ReservedSlot();
            cappedSlot.setEmail(slot.getEmail());
            cappedSlot.setName(slot.getName());
            cappedSlot.setSlots(slotsToAdd);
            cappedSlots.add(cappedSlot);

            remainingCapacity -= slotsToAdd;
        }

        return cappedSlots;
    }
}
