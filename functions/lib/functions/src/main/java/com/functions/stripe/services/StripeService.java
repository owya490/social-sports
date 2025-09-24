package com.functions.stripe.services;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.firebase.services.FirebaseService;
import com.functions.stripe.models.requests.GetStripeCheckoutUrlByEventIdRequest;
import com.functions.stripe.models.responses.GetStripeCheckoutUrlByEventIdResponse;
import com.functions.utils.JavaUtils;
import com.functions.utils.UrlUtils;

public class StripeService {
    private static final Logger logger = LoggerFactory.getLogger(StripeService.class);

    public static final String FIREBASE_FUNCTIONS_GET_STRIPE_CHECKOUT_URL_BY_EVENT_ID = "get_stripe_checkout_url_by_event_id";

    // TODO: configure cancel URL
    public static String getStripeCheckoutFromEventId(String eventId,
                                                      boolean isPrivate,
                                                      Integer numTickets,
                                                      Optional<String> successUrl,
                                                      Optional<String> cancelUrl,
                                                      String fulfilmentSessionId,
                                                      String endFulfilmentEntityId) {
        try {
            // TODO: remove price getting from stripe function. The price value should be
            // from the stored
            // event data in the fulfilment session.
            String newSuccessUrl = successUrl.orElse(UrlUtils.getUrlWithCurrentEnvironment(String.format("/event/success/%s", eventId))
                    .orElse(UrlUtils.SPORTSHUB_URL));
            logger.info(
                    "Getting Stripe checkout URL for event ID: {}, isPrivate: {}, numTickets: {}, successUrl: {}, fulfilmentSessionId: {}",
                    eventId, isPrivate, numTickets, newSuccessUrl, fulfilmentSessionId);

            GetStripeCheckoutUrlByEventIdRequest request = new GetStripeCheckoutUrlByEventIdRequest(
                    eventId,
                    isPrivate,
                    numTickets,
                    cancelUrl.orElse(UrlUtils.SPORTSHUB_URL),
                    newSuccessUrl,
                    true,
                    fulfilmentSessionId,
                    endFulfilmentEntityId
            );

            return FirebaseService.callFirebaseFunction(FIREBASE_FUNCTIONS_GET_STRIPE_CHECKOUT_URL_BY_EVENT_ID, request)
                    .map(response -> {
                        try {
                            GetStripeCheckoutUrlByEventIdResponse stripeResponse = JavaUtils.objectMapper
                                    .readValue(response.result(), GetStripeCheckoutUrlByEventIdResponse.class);
                            return stripeResponse.url();
                        } catch (Exception e) {
                            logger.error("Failed to parse Stripe checkout response for event ID {}: {}", eventId,
                                    e.getMessage());
                            throw new RuntimeException("Failed to parse Stripe checkout response", e);
                        }
                    }).orElseThrow(() -> new RuntimeException("Failed to get Stripe checkout URL"));
        } catch (Exception e) {
            logger.error("Error getting Stripe checkout URL for event ID {}: {}", eventId, e.getMessage());
            throw new RuntimeException("Failed to get Stripe checkout URL", e);
        }
    }
}
