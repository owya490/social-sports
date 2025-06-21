package com.functions.fulfilment.services;

import com.functions.events.models.EventData;
import com.functions.events.repositories.EventsRepository;
import com.functions.forms.services.FormsService;
import com.functions.fulfilment.models.*;
import com.functions.fulfilment.repositories.FulfilmentSessionRepository;
import com.functions.stripe.services.StripeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

public class FulfilmentService {
    private static final Logger logger = LoggerFactory.getLogger((FulfilmentService.class));


    /**
     * Initializes a checkout fulfilment session for the given event ID with specified fulfilment entity types.
     * <p>
     * NOTE: fulfilmentEntityTypes specifies the order of fulfilment entities to be executed.
     */
    public static Optional<String> initCheckoutFulfilmentSession(String eventId,
                                                                 Integer numTickets,
                                                                 List<FulfilmentEntityType> fulfilmentEntityTypes,
                                                                 String endUrl) {
        try {
            Optional<EventData> maybeEventData = EventsRepository.getEventById(eventId);
            if (maybeEventData.isEmpty()) {
                logger.error("Failed to find event data for event ID: {}", eventId);
                throw new Exception("Failed to find event data for event ID: " + eventId);
            }

            EventData eventData = maybeEventData.get();

            List<FulfilmentEntity> fulfilmentEntities = new ArrayList<>();
            String currNextUrl = endUrl;

            ListIterator<FulfilmentEntityType> it = fulfilmentEntityTypes.listIterator(fulfilmentEntityTypes.size());
            // we iterate backwards through the fulfilmentEntityTypes list so we have the nextUrl available in each iteration
            while (it.hasPrevious()) {
                FulfilmentEntityType type = it.previous();
                switch (type) {
                    case STRIPE: {
                        Optional<String> stripeCheckoutLink = StripeService.getStripeCheckoutFromEventId(
                                eventId,
                                eventData.getIsPrivate(),
                                numTickets,
                                Optional.empty()
                        );
                        if (stripeCheckoutLink.isEmpty()) {
                            logger.error("initFulfilmentSession: No Stripe checkout link found for event ID: {}", eventId);
                            continue;
                        }

                        fulfilmentEntities.add(StripeFulfilmentEntity.builder().stripeCheckoutLink(stripeCheckoutLink.get()).nextUrl(currNextUrl).build());
                        currNextUrl = stripeCheckoutLink.get();
                        break;
                    }
                    case FORMS: {
                        Optional<String> formId = FormsService.getFormIdByEventId(eventId);
                        if (formId.isEmpty()) {
                            logger.warn("initFulfilmentSession: No form found for event ID: {}", eventId);
                            continue;
                        }
                        fulfilmentEntities.add(
                                FormsFulfilmentEntity.builder()
                                        .formId(formId.get())
                                        .formResponseIds(new ArrayList<>())
                                        .submittedFormResponseIds(new ArrayList<>())
                                        .nextUrl(currNextUrl)
                                        .build()
                        );
                        // TODO: need to update currNextUrl to the form URL: https://owenyang.atlassian.net/browse/SPORTSHUB-367
                        break;
                    }
                }
            }

            FulfilmentService.createFulfilmentSession(eventId, fulfilmentEntities).flatMap( fulfilmentSessionId -> {
                if (fulfilmentSessionId.isEmpty()) {
                    throw new RuntimeException("Failed to create fulfilment session for event ID: " + eventId);
                }
                return Optional.of(fulfilmentSessionId);
            });
        } catch (Exception e) {
            logger.error("Failed to init checkout fulfilment session: {}", eventId, e);
        }
        return Optional.empty();
    }

    private static Optional<String> createFulfilmentSession(String eventId, List<FulfilmentEntity> fulfilmentEntities) {
        try {
            String fulfilmentSessionId = FulfilmentSessionRepository.createFulfilmentSession(FulfilmentSession.builder()
                    .fulfilmentSessionStartTime(com.google.cloud.Timestamp.now())
                    .eventId(eventId)
                    .fulfilmentEntities(fulfilmentEntities)
                    .currentFulfilmentIndex(0) // Start with the first entity // TODO: need to review whether this is actually the best way
                    .build());

            logger.info("Fulfilment session created with ID: {} for event ID: {}", fulfilmentSessionId, eventId);
            return Optional.of(fulfilmentSessionId);
        } catch (Exception e) {
            logger.error("Failed to create fulfilment session for event ID: {}", eventId, e);
            return Optional.empty();
        }
    }
}
