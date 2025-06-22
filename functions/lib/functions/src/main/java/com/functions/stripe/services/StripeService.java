package com.functions.stripe.services;

import com.functions.firebase.services.FirebaseService;
import com.functions.stripe.models.responses.GetStripeCheckoutUrlByEventIdResponse;
import com.functions.utils.JavaUtils;
import com.functions.utils.UrlUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.Optional;

public class StripeService {
    private static final Logger logger = LoggerFactory.getLogger(StripeService.class);

    public static final String FIREBASE_FUNCTIONS_GET_STRIPE_CHECKOUT_URL_BY_EVENT_ID = "get_stripe_checkout_url_by_event_id";

    public static Optional<String> getStripeCheckoutFromEventId(String eventId,
                                                                boolean isPrivate,
                                                                Integer numTickets,
                                                                Optional<String> successUrl) {
        try {
            return FirebaseService.callFirebaseFunction(FIREBASE_FUNCTIONS_GET_STRIPE_CHECKOUT_URL_BY_EVENT_ID,
                    Map.of(
                            "eventId", eventId,
                            "isPrivate", isPrivate,
                            "quantity", numTickets,
                            "cancelUrl", UrlUtils.getUrlWithCurrentEnvironment(String.format("/event/%s", eventId)).orElse("https://sportshub.net.au/dashboard"),
                            "successUrl", successUrl.orElse(UrlUtils.getUrlWithCurrentEnvironment(String.format("/event/success/%s", eventId)).orElse("https://sportshub.net.au/dashboard"))
                    )).flatMap(response -> {
                GetStripeCheckoutUrlByEventIdResponse stripeResponse;
                try {
                    stripeResponse = JavaUtils.objectMapper.readValue(response.result(), GetStripeCheckoutUrlByEventIdResponse.class);
                } catch (Exception e) {
                    logger.error("Failed to parse Stripe checkout response for event ID {}: {}", eventId, e.getMessage());
                    return Optional.empty();
                }
                return Optional.of(stripeResponse.url());
            });
        } catch (Exception e) {
            logger.error("Error getting Stripe checkout URL for event ID {}: {}", eventId, e.getMessage());
            return Optional.empty();
        }
    }
}
