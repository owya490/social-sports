package com.functions.fulfilment.models;

import com.functions.events.models.EventData;
import com.functions.events.models.ResolvedEventTicketType;
import com.functions.events.services.EventTicketTypeService;
import com.functions.events.utils.EventsUtils;
import com.functions.fulfilment.payment.PaymentProviderPolicy;
import com.functions.global.exceptions.NotFoundException;

public sealed interface FulfilmentInitialisationScope {
    default ResolvedEventTicketType validateEvent(EventData event, Integer quantity, String ticketId) throws Exception {
        if (this instanceof FulfilmentInitialisationScope.PartnerPublic partner) {
            if (!Boolean.TRUE.equals(event.getIsActive()) || !Boolean.FALSE.equals(event.getIsPrivate())
                    || !partner.expectedOrganiserId().equals(event.getOrganiserId())) {
                throw unavailable();
            }
        }
        EventsUtils.validateEventTiming(event);
        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("Invalid numTickets");
        }
        Integer maxTickets = event.getMaxTicketsPerTransaction();
        if (maxTickets != null && quantity > maxTickets) {
            throw new IllegalArgumentException(String.format(
                    "Requested %d tickets exceeds maxTicketsPerTransaction (%d) for event %s",
                    quantity, maxTickets, event.getEventId()));
        }
        return this instanceof FulfilmentInitialisationScope.PartnerPublic
                ? EventTicketTypeService.resolvePublicById(event, ticketId).orElseThrow(FulfilmentInitialisationScope::unavailable)
                : EventTicketTypeService.resolveById(event, ticketId);
    }

    default void validatePaymentProvider(EventData event, ResolvedEventTicketType ticket) {
        if (this instanceof FulfilmentInitialisationScope.PartnerPublic && ticket.getPrice() > 0
                && !PaymentProviderPolicy.supportsStripe(event)) {
            throw new IllegalArgumentException("Stripe booking is not available");
        }
    }

    private static NotFoundException unavailable() {
        return new NotFoundException("Event is not available");
    }

    record Guest() implements FulfilmentInitialisationScope {}

    record PartnerPublic(String expectedOrganiserId) implements FulfilmentInitialisationScope {
        public PartnerPublic {
            if (expectedOrganiserId == null || expectedOrganiserId.isBlank()) {
                throw new IllegalArgumentException("Partner organiser is required");
            }
        }
    }
}
