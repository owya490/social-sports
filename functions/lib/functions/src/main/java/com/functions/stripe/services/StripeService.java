package com.functions.stripe.services;

import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.firebase.services.FirebaseService;
import com.functions.stripe.models.responses.GetStripeCheckoutUrlByEventIdResponse;
import com.functions.utils.JavaUtils;
import com.functions.utils.UrlUtils;

public class StripeService {
    private static final Logger logger = LoggerFactory.getLogger(StripeService.class);

    public static final String FIREBASE_FUNCTIONS_GET_STRIPE_CHECKOUT_URL_BY_EVENT_ID = "get_stripe_checkout_url_by_event_id";

    // TODO: configure cancel URL
    public static Optional<String> getStripeCheckoutFromEventId(String eventId,
            boolean isPrivate,
            Integer numTickets,
            Optional<String> successUrl,
            Optional<String> cancelUrl,
            String fulfilmentSessionId) {
        try {
            // TODO: remove price getting from stripe function. The price value should be
            // from the stored
            // event data in the fulfilment session.
            logger.info(
                    "Getting Stripe checkout URL for event ID: {}, isPrivate: {}, numTickets: {}, successUrl: {}, fulfilmentSessionId: {}",
                    eventId, isPrivate, numTickets, successUrl.orElse("N/A"), fulfilmentSessionId);
            return FirebaseService.callFirebaseFunction(FIREBASE_FUNCTIONS_GET_STRIPE_CHECKOUT_URL_BY_EVENT_ID,
                    Map.of(
                            "eventId", eventId,
                            "isPrivate", isPrivate,
                            "quantity", numTickets,
                            "cancelUrl",
                            cancelUrl.orElse("https://sportshub.net.au/dashboard"),
                            "successUrl",
                            successUrl.orElse(
                                    UrlUtils.getUrlWithCurrentEnvironment(String.format("/event/success/%s", eventId))
                                            .orElse("https://sportshub.net.au/dashboard"))))
                    .map(response -> {
                        try {
                            GetStripeCheckoutUrlByEventIdResponse stripeResponse = JavaUtils.objectMapper
                                    .readValue(response.result(), GetStripeCheckoutUrlByEventIdResponse.class);
                            return stripeResponse.url();
                        } catch (Exception e) {
                            logger.error("Failed to parse Stripe checkout response for event ID {}: {}", eventId,
                                    e.getMessage());
                            return null;
                        }
                    }).filter(url -> url != null);
        } catch (Exception e) {
            logger.error("Error getting Stripe checkout URL for event ID {}: {}", eventId, e.getMessage());
            return Optional.empty();
        }
    }
}
