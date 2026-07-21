package com.functions.attendee.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.attendee.models.requests.AddAttendeeRequest;
import com.functions.attendee.models.requests.SetAttendeeTicketsRequest;
import com.functions.attendee.models.responses.AddAttendeeResponse;
import com.functions.attendee.models.responses.SetAttendeeTicketsResponse;
import com.functions.events.models.EventData;
import com.functions.events.models.ResolvedEventTicketType;
import com.functions.events.repositories.EventTicketTypeRepository;
import com.functions.events.repositories.EventsRepository;
import com.functions.events.services.EventTicketTypeService;
import com.functions.firebase.services.FirebaseService;
import com.functions.tickets.models.Order;
import com.functions.tickets.models.OrderAndTicketStatus;
import com.functions.tickets.models.OrderAndTicketType;
import com.functions.tickets.models.Ticket;
import com.functions.tickets.repositories.OrdersRepository;
import com.functions.tickets.repositories.TicketsRepository;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.FieldValue;

public class AttendeeService {
    private static final Logger logger = LoggerFactory.getLogger(AttendeeService.class);

    /**
     * Adds an attendee by creating a new APPROVED Order with N APPROVED Tickets,
     * and atomically decrementing General Admission vacancy.
     */
    public static AddAttendeeResponse addAttendee(AddAttendeeRequest request) throws Exception {
        logger.info("Adding attendee for eventId: {}, email: {}, numTickets: {}",
                request.eventId(), request.email(), request.numTickets());

        return FirebaseService.createFirestoreTransaction(transaction -> {
            EventData eventData = EventsRepository.getEventById(request.eventId(), Optional.of(transaction))
                    .orElseThrow(() -> new RuntimeException("Event not found: " + request.eventId()));

            DocumentReference eventRef = EventsRepository.getEventDocumentReferenceInTransaction(request.eventId(),
                    transaction);

            ResolvedEventTicketType ticketType = EventTicketTypeService.resolve(eventData);
            EventTicketTypeService.validateAvailability(ticketType, request.numTickets());

            Timestamp now = Timestamp.now();
            String orderId = OrdersRepository.generateOrderId();

            Order order = new Order();
            order.setEmail(request.email());
            order.setFullName(request.fullName());
            order.setPhone(request.phone());
            order.setStripePaymentIntentId("");
            order.setDatePurchased(now);
            order.setApplicationFees(0);
            order.setDiscounts(0);
            order.setStatus(OrderAndTicketStatus.APPROVED);
            order.setType(OrderAndTicketType.MANUAL);

            List<String> ticketIds = new ArrayList<>();
            for (int i = 0; i < request.numTickets(); i++) {
                Ticket ticket = new Ticket();
                ticket.setEventId(request.eventId());
                ticket.setOrderId(orderId);
                ticket.setPrice(request.price());
                ticket.setPurchaseDate(now);
                ticket.setStatus(OrderAndTicketStatus.APPROVED);
                ticket.setType(OrderAndTicketType.MANUAL);
                EventTicketTypeService.stampTicket(ticket, ticketType);

                String ticketId = TicketsRepository.createTicket(ticket, transaction);
                ticketIds.add(ticketId);
            }

            order.setTickets(ticketIds);
            OrdersRepository.createOrder(order, request.eventId(), orderId, transaction);

            DocumentReference metadataRef = EventsRepository.getEventMetadataDocumentReference(request.eventId());
            transaction.update(metadataRef, "completeTicketCount", FieldValue.increment(request.numTickets()));
            EventTicketTypeRepository.setVacancy(transaction, eventRef, ticketType,
                    ticketType.getVacancy() - request.numTickets());

            logger.info("Added attendee: orderId={}, ticketCount={}, eventId={}",
                    orderId, ticketIds.size(), request.eventId());
            return new AddAttendeeResponse(orderId, ticketIds);
        });
    }

    /**
     * Adjusts the ticket count for an existing order.
     * <ul>
     * <li>numTickets == 0: REJECT the entire order, restore vacancy</li>
     * <li>numTickets > current APPROVED count: create additional APPROVED tickets,
     * decrement vacancy</li>
     * <li>numTickets < current APPROVED count (but > 0): REJECT excess tickets,
     * restore vacancy</li>
     * </ul>
     */
    public static SetAttendeeTicketsResponse setAttendeeTickets(SetAttendeeTicketsRequest request) throws Exception {
        logger.info("Setting attendee tickets for orderId: {}, eventId: {}, numTickets: {}",
                request.orderId(), request.eventId(), request.numTickets());

        return FirebaseService.createFirestoreTransaction(transaction -> {
            EventData eventData = EventsRepository.getEventById(request.eventId(), Optional.of(transaction))
                    .orElseThrow(() -> new RuntimeException("Event not found: " + request.eventId()));

            DocumentReference eventRef = EventsRepository.getEventDocumentReferenceInTransaction(request.eventId(),
                    transaction);

            Order order = OrdersRepository.getOrderById(request.orderId(), Optional.of(transaction))
                    .orElseThrow(() -> new RuntimeException("Order not found: " + request.orderId()));

            List<Ticket> allTickets = TicketsRepository.getTicketsByIds(order.getTickets(), Optional.of(transaction));

            List<Ticket> approvedTickets = allTickets.stream()
                    .filter(t -> t.getStatus() == OrderAndTicketStatus.APPROVED)
                    .collect(Collectors.toList());

            ResolvedEventTicketType ticketType = EventTicketTypeService.resolve(eventData);

            int currentApproved = approvedTickets.size();
            int target = request.numTickets();
            int delta = target - currentApproved;

            if (target == 0) {
                for (Ticket ticket : approvedTickets) {
                    ticket.setStatus(OrderAndTicketStatus.REJECTED);
                    TicketsRepository.updateTicket(ticket.getTicketId(), ticket, Optional.of(transaction));
                }
                order.setStatus(OrderAndTicketStatus.REJECTED);
                OrdersRepository.updateOrder(order.getOrderId(), order, Optional.of(transaction));

                DocumentReference metadataRef = EventsRepository.getEventMetadataDocumentReference(request.eventId());
                transaction.update(metadataRef, "completeTicketCount", FieldValue.increment(-currentApproved));

                EventTicketTypeRepository.setVacancy(transaction, eventRef, ticketType,
                        ticketType.getVacancy() + currentApproved);

                return new SetAttendeeTicketsResponse(order.getOrderId(), true,
                        String.format("Order %s rejected. Restored %d tickets to vacancy.", order.getOrderId(),
                                currentApproved));

            } else if (delta > 0) {
                EventTicketTypeService.validateAvailability(ticketType, delta);

                Timestamp now = Timestamp.now();
                long price = approvedTickets.isEmpty() ? 0 : approvedTickets.get(0).getPrice();
                List<String> newTicketIds = new ArrayList<>();

                for (int i = 0; i < delta; i++) {
                    Ticket ticket = new Ticket();
                    ticket.setEventId(request.eventId());
                    ticket.setOrderId(order.getOrderId());
                    ticket.setPrice(price);
                    ticket.setPurchaseDate(now);
                    ticket.setStatus(OrderAndTicketStatus.APPROVED);
                    ticket.setType(OrderAndTicketType.MANUAL);
                    EventTicketTypeService.stampTicket(ticket, ticketType);

                    String ticketId = TicketsRepository.createTicket(ticket, transaction);
                    newTicketIds.add(ticketId);
                }

                List<String> updatedTicketList = new ArrayList<>(order.getTickets());
                updatedTicketList.addAll(newTicketIds);
                order.setTickets(updatedTicketList);
                OrdersRepository.updateOrder(order.getOrderId(), order, Optional.of(transaction));

                DocumentReference metadataRef = EventsRepository.getEventMetadataDocumentReference(request.eventId());
                transaction.update(metadataRef, "completeTicketCount", FieldValue.increment(delta));

                EventTicketTypeRepository.setVacancy(transaction, eventRef, ticketType,
                        ticketType.getVacancy() - delta);

                return new SetAttendeeTicketsResponse(order.getOrderId(), true,
                        String.format("Added %d tickets to order %s.", delta, order.getOrderId()));

            } else if (delta < 0) {
                int toReject = Math.abs(delta);
                List<Ticket> ticketsToReject = approvedTickets.subList(currentApproved - toReject, currentApproved);

                for (Ticket ticket : ticketsToReject) {
                    ticket.setStatus(OrderAndTicketStatus.REJECTED);
                    TicketsRepository.updateTicket(ticket.getTicketId(), ticket, Optional.of(transaction));
                }

                DocumentReference metadataRef = EventsRepository.getEventMetadataDocumentReference(request.eventId());
                transaction.update(metadataRef, "completeTicketCount", FieldValue.increment(-toReject));

                EventTicketTypeRepository.setVacancy(transaction, eventRef, ticketType,
                        ticketType.getVacancy() + toReject);

                return new SetAttendeeTicketsResponse(order.getOrderId(), true,
                        String.format("Rejected %d tickets from order %s.", toReject, order.getOrderId()));

            } else {
                return new SetAttendeeTicketsResponse(order.getOrderId(), true,
                        "No change needed. Ticket count already matches.");
            }
        });
    }
}
