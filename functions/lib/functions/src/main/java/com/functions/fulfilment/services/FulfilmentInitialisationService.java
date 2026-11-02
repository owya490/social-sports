package com.functions.fulfilment.services;

import java.time.Instant;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import com.functions.events.models.EventData;
import com.functions.events.models.ResolvedEventTicketType;
import com.functions.events.repositories.EventsRepository;
import com.functions.firebase.services.FirebaseService;
import com.functions.fulfilment.models.FulfilmentInitialisationScope;
import com.functions.fulfilment.models.InitialisedFulfilmentSession;
import com.functions.fulfilment.models.PaymentProvider;
import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;
import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSessionType;
import com.functions.fulfilment.repositories.FulfilmentSessionRepository;
import com.functions.global.exceptions.NotFoundException;
import com.functions.stripe.exceptions.CheckoutDateTimeException;

public final class FulfilmentInitialisationService {
    private FulfilmentInitialisationService() {}

    public static InitialisedFulfilmentSession initialise(String eventId, Integer numTickets,
            String eventTicketTypeId, PaymentProvider paymentProvider, FulfilmentInitialisationScope scope)
            throws Exception {
        if (paymentProvider == PaymentProvider.PYNG) {
            throw new IllegalArgumentException("Pay with Pyng is not available");
        }
        Objects.requireNonNull(scope, "Initialisation scope is required");
        if (numTickets == null || numTickets <= 0) {
            if (scope instanceof FulfilmentInitialisationScope.Guest) {
                throw new Exception("Invalid numTickets " + numTickets + " for eventId " + eventId);
            }
            throw new IllegalArgumentException("Invalid numTickets");
        }
        if (eventTicketTypeId == null || eventTicketTypeId.isBlank()) {
            throw new IllegalArgumentException("eventTicketTypeId is required");
        }

        EventData eventData = scope instanceof FulfilmentInitialisationScope.PartnerPublic
                ? EventsRepository.getActivePublicEventById(eventId).orElseThrow(FulfilmentInitialisationService::unavailable)
                : EventsRepository.getActiveEventById(eventId)
                        .orElseThrow(() -> new CheckoutDateTimeException("Event " + eventId + " is not available"));
        ResolvedEventTicketType ticket = scope.validateEvent(eventData, numTickets, eventTicketTypeId);
        FulfilmentInitialisationScope bookingScope = scope.withBookingSnapshot(eventData, ticket);
        PaymentProvider provider = paymentProvider == null ? PaymentProvider.STRIPE : paymentProvider;
        if (scope instanceof FulfilmentInitialisationScope.PartnerPublic && provider != PaymentProvider.STRIPE) {
            throw new IllegalArgumentException("Unsupported payment provider");
        }
        FulfilmentSessionType type;
        if (provider == PaymentProvider.PYNG) {
            type = FulfilmentSessionType.PYNG_CHECKOUT;
        } else if (Boolean.TRUE.equals(eventData.getWaitlistEnabled()) && ticket.getVacancy() != null
                && ticket.getVacancy() <= 0) {
            type = FulfilmentSessionType.WAITLIST;
        } else if (Boolean.TRUE.equals(eventData.getBookingApprovalEnabled())) {
            type = FulfilmentSessionType.BOOKING_APPROVAL;
        } else {
            type = FulfilmentSessionType.CHECKOUT;
        }
        if (type != FulfilmentSessionType.WAITLIST) {
            scope.validatePaymentProvider(eventData, ticket);
        }

        String sessionId = UUID.randomUUID().toString();
        FulfilmentSession session = type.getFulfilmentSessionService().initFulfilmentSession(
                sessionId, eventData, numTickets, eventTicketTypeId, bookingScope);
        String firstEntityId = session.getFulfilmentEntityIds().get(0);

        if (type == FulfilmentSessionType.WAITLIST && scope instanceof FulfilmentInitialisationScope.PartnerPublic) {
            Instant validationTime = Instant.now();
            FirebaseService.createFirestoreTransaction(transaction -> {
                EventData current = EventsRepository.getActiveEventById(eventId, false, transaction)
                        .orElseThrow(FulfilmentInitialisationService::unavailable);
                ResolvedEventTicketType currentTicket = bookingScope.validateEvent(
                        current, numTickets, eventTicketTypeId, validationTime);
                if (!Boolean.TRUE.equals(current.getWaitlistEnabled())) {
                    throw unavailable();
                }
                if (currentTicket.getVacancy() > 0) {
                    throw new IllegalArgumentException("Event booking requirements changed; refresh and try again");
                }
                FulfilmentSessionRepository.createFulfilmentSession(sessionId, session, Optional.of(transaction));
                return null;
            });
        } else {
            FulfilmentSessionRepository.createFulfilmentSession(sessionId, session, Optional.empty());
        }
        return new InitialisedFulfilmentSession(sessionId, firstEntityId);
    }

    private static NotFoundException unavailable() {
        return new NotFoundException("Event is not available");
    }
}
