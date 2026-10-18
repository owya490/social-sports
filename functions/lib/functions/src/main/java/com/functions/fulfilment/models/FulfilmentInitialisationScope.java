package com.functions.fulfilment.models;

import java.time.Instant;

import com.functions.events.models.EventData;
import com.functions.events.models.ResolvedEventTicketType;
import com.functions.events.services.EventTicketTypeService;
import com.functions.events.utils.EventsUtils;
import com.functions.fulfilment.payment.PaymentProviderPolicy;
import com.functions.global.exceptions.NotFoundException;
import com.functions.stripe.services.StripeService;

public sealed interface FulfilmentInitialisationScope {
    default ResolvedEventTicketType validateEvent(EventData event, Integer quantity, String ticketId) throws Exception {
        return validateEvent(event, quantity, ticketId, Instant.now());
    }

    default ResolvedEventTicketType validateEvent(EventData event, Integer quantity, String ticketId,
            Instant validationTime) throws Exception {
        if (this instanceof FulfilmentInitialisationScope.PartnerPublic partner) {
            if (!Boolean.TRUE.equals(event.getIsActive()) || !Boolean.FALSE.equals(event.getIsPrivate())
                    || !partner.expectedOrganiserId().equals(event.getOrganiserId())) {
                throw unavailable();
            }
        }
        EventsUtils.validateEventTiming(event, validationTime);
        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("Invalid numTickets");
        }
        Integer maxTickets = event.getMaxTicketsPerTransaction();
        if (maxTickets != null && quantity > maxTickets) {
            throw new IllegalArgumentException(String.format(
                    "Requested %d tickets exceeds maxTicketsPerTransaction (%d) for event %s",
                    quantity, maxTickets, event.getEventId()));
        }
        ResolvedEventTicketType ticket = this instanceof FulfilmentInitialisationScope.PartnerPublic
                ? EventTicketTypeService.resolvePublicById(event, ticketId).orElseThrow(FulfilmentInitialisationScope::unavailable)
                : EventTicketTypeService.resolveById(event, ticketId);
        if (this instanceof FulfilmentInitialisationScope.PartnerPublic partner
                && partner.bookingSnapshot() != null
                && !partner.bookingSnapshot().equals(BookingSnapshot.from(event, ticket))) {
            throw new IllegalArgumentException("Event ticket details changed; refresh and try again");
        }
        return ticket;
    }

    default void validatePaymentProvider(EventData event, ResolvedEventTicketType ticket) {
        if (this instanceof FulfilmentInitialisationScope.PartnerPublic) {
            if (ticket.getPrice() > 0 && !PaymentProviderPolicy.supportsStripe(event)) {
                throw new IllegalArgumentException("Stripe booking is not available");
            }
            if (!Boolean.TRUE.equals(event.getPaymentsActive())) {
                throw new IllegalArgumentException("Event payments are not enabled");
            }
            if (ticket.getPrice() != 0 && ticket.getPrice() < StripeService.MIN_PRICE_AMOUNT_FOR_STRIPE_CHECKOUT) {
                throw new IllegalArgumentException("Ticket price is not supported for checkout");
            }
        }
    }

    private static NotFoundException unavailable() {
        return new NotFoundException("Event is not available");
    }

    record Guest() implements FulfilmentInitialisationScope {}

    record BookingSnapshot(String ticketName, Integer priceCents, String formId) {
        static BookingSnapshot from(EventData event, ResolvedEventTicketType ticket) {
            return new BookingSnapshot(ticket.getName(), ticket.getPrice(),
                    EventTicketTypeService.resolveFormId(event, ticket.getId()).orElse(null));
        }
    }

    record PartnerPublic(String expectedOrganiserId, BookingSnapshot bookingSnapshot) implements FulfilmentInitialisationScope {
        public PartnerPublic(String expectedOrganiserId) {
            this(expectedOrganiserId, null);
        }

        public PartnerPublic withBookingSnapshot(EventData event, ResolvedEventTicketType ticket) {
            return new PartnerPublic(expectedOrganiserId, BookingSnapshot.from(event, ticket));
        }

        public PartnerPublic {
            if (expectedOrganiserId == null || expectedOrganiserId.isBlank()) {
                throw new IllegalArgumentException("Partner organiser is required");
            }
        }
    }
}
