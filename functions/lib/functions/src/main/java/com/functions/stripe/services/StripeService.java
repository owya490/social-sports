package com.functions.stripe.services;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.firebase.services.FirebaseService;
import com.functions.stripe.config.StripeConfig;
import com.functions.stripe.exceptions.CheckoutDateTimeException;
import com.functions.stripe.exceptions.CheckoutVacancyException;
import com.functions.stripe.models.requests.CreateStripeCheckoutSessionRequest;
import com.functions.stripe.models.responses.CreateStripeCheckoutSessionResponse;
import com.functions.utils.JavaUtils;
import com.functions.utils.UrlUtils;

/**
 * Service class for Stripe operations.
 * Now uses the Java CheckoutService directly instead of calling Python functions.
 */
public class StripeService {
    private static final Logger logger = LoggerFactory.getLogger(StripeService.class);

    public static final String FIREBASE_FUNCTIONS_GET_STRIPE_CHECKOUT_URL_BY_EVENT_ID = "get_stripe_checkout_url_by_event_id";
    public static final String ERROR_URL = "/error";

    // https://docs.stripe.com/api/charges#:~:text=The%20minimum%20amount%20is%20%240.50%20US%20or%20equivalent%20in%20charge%20currency.
    public static final int MIN_PRICE_AMOUNT_FOR_STRIPE_CHECKOUT = 50;

    /**
     * Gets a Stripe checkout URL for the specified event.
     *
     * @param eventId The event ID to create a checkout for
     * @param isPrivate Whether the event is private
     * @param numTickets Number of tickets to purchase
     * @param successUrl Optional success URL (defaults to event success page)
     * @param cancelUrl Optional cancel URL (defaults to home page)
     * @param fulfilmentSessionId The fulfilment session ID
     * @param endFulfilmentEntityId The end fulfilment entity ID
     * @return The Stripe checkout URL
     * @throws RuntimeException if checkout creation fails
     */
    public static String getStripeCheckoutFromEventId(String eventId,
                                                      boolean isPrivate,
                                                      Integer numTickets,
                                                      Optional<String> successUrl,
                                                      Optional<String> cancelUrl,
                                                      String fulfilmentSessionId,
                                                      String endFulfilmentEntityId) {
        String newSuccessUrl = successUrl.orElse(
                UrlUtils.getUrlWithCurrentEnvironment(String.format("/event/success/%s", eventId))
                        .orElse(UrlUtils.SPORTSHUB_URL));
        
        String newCancelUrl = cancelUrl.orElse(
                UrlUtils.getUrlWithCurrentEnvironment("/")
                        .orElse(UrlUtils.SPORTSHUB_URL));

        logger.info(
                "Getting Stripe checkout URL for event ID: {}, isPrivate: {}, numTickets: {}, " +
                "successUrl: {}, cancelUrl: {}, fulfilmentSessionId: {}",
                eventId, isPrivate, numTickets, newSuccessUrl, newCancelUrl, fulfilmentSessionId);

        CreateStripeCheckoutSessionRequest request = new CreateStripeCheckoutSessionRequest(
                eventId,
                isPrivate,
                numTickets,
                newCancelUrl,
                newSuccessUrl,
                true,
                fulfilmentSessionId,
                endFulfilmentEntityId
        );

        if (StripeConfig.JAVA_STRIPE_ENABLED) {
            try {
                CreateStripeCheckoutSessionResponse response = CheckoutService.createStripeCheckoutSession(request);

                if (response == null || response.url() == null) {
                    logger.error("Received null or invalid response from CheckoutService for event ID: {}", eventId);
                    throw new RuntimeException("Failed to get Stripe checkout URL - null response");
                }

                logger.info("Successfully retrieved Stripe checkout URL for event ID: {}", eventId);

                return response.url();
            } catch (CheckoutDateTimeException e) {
                // We don't need to log error and alert for this error because this
                // time based error is out of our direct control.
                // We should just reject silently and prevent the entire checkout transaction
                // from going ahead.
                logger.warn("Cannot checkout for event {}: time based error: {}", eventId, e);
                throw e;
            } catch (CheckoutVacancyException e) {
                // We don't need to log error and alert for this error because this
                // vacancy based error is out of our direct control.
                // We should just reject silently and prevent the entire checkout transaction
                // from going ahead.
                logger.warn("Cannot checkout for event {}: vacancy based error: {}", eventId, e);
                throw e;
            } catch (Exception e) {
                logger.error("Failed to create Stripe checkout session for event ID {}: {}", eventId, e.getMessage());
                throw new RuntimeException("Failed to create Stripe checkout session", e);
            }
        }

        return FirebaseService.callFirebaseFunction(FIREBASE_FUNCTIONS_GET_STRIPE_CHECKOUT_URL_BY_EVENT_ID, request)
        .map(response -> {
            try {
                CreateStripeCheckoutSessionResponse stripeResponse = JavaUtils.objectMapper
                        .readValue(response.result(), CreateStripeCheckoutSessionResponse.class);
                            // If the stripe checkout URL is null, error URL, or cancel URL, throw a runtime exception
                            if (stripeResponse.url() == null 
                                || stripeResponse.url().equals(ERROR_URL) 
                                || stripeResponse.url().equals(cancelUrl.orElse(UrlUtils.SPORTSHUB_URL
                            ))) {
                                logger.error("Stripe checkout URL is null or error URL or cancel URL. Throwing runtime exception.");
                                throw new RuntimeException("Stripe checkout URL is null or error URL or cancel URL.");
                            }
                return stripeResponse.url();
            } catch (Exception e) {
                logger.error("Failed to parse Stripe checkout response for event ID {}: {}", eventId,
                        e.getMessage());
                throw new RuntimeException("Failed to parse Stripe checkout response", e);
            }
        }).orElseThrow(() -> new RuntimeException("Failed to get Stripe checkout URL"));
    }
}

