package com.functions.stripe.services;

import java.time.Instant;
import java.util.Optional;

import javax.annotation.Nonnull;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventData;
import com.functions.events.repositories.EventsRepository;
import com.functions.events.utils.EventsUtils;
import com.functions.firebase.services.FirebaseService;
import com.functions.stripe.config.StripeConfig;
import com.functions.stripe.exceptions.CheckoutVacancyException;
import com.functions.stripe.models.requests.CreateStripeCheckoutSessionRequest;
import com.functions.stripe.models.responses.CreateStripeCheckoutSessionResponse;
import com.functions.users.models.PrivateUserData;
import com.functions.users.services.Users;
import com.functions.users.utils.UsersUtils;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;
import com.stripe.exception.StripeException;
import com.stripe.model.Account;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;

/**
 * Service class for handling Stripe checkout operations.
 */
public class CheckoutService {
    private static final Logger logger = LoggerFactory.getLogger(CheckoutService.class);

    /**
     * Data transfer object holding Stripe session creation result.
     */
    private static record StripeSessionResult(@Nonnull String sessionId, @Nonnull String checkoutUrl) {}

    /**
     * Data transfer object holding the result of the checkout transaction.
     */
    private static record CheckoutTransactionResult(@Nonnull EventData eventData, @Nonnull String stripeAccountId) {}

    /**
     * Creates a Stripe checkout session for an event.
     * 
     * Flow:
     * 1. SPORTSHUB domain specific operations
     * 2. Create Stripe checkout session (external I/O) with retries - revert tickets transaction is this fails
     * 
     * @param request The checkout session request
     * @return Response containing the checkout URL
     */
    public static CreateStripeCheckoutSessionResponse createStripeCheckoutSession(
            CreateStripeCheckoutSessionRequest request) throws Exception {
        logger.info("Creating checkout session for event {} ({} tickets)", request.eventId(), request.quantity());

        // Section A: Perform SPORTSHUB domain specific operations
        CheckoutTransactionResult checkoutTransactionResult = FirebaseService.createFirestoreTransaction(transaction -> {
            Optional<EventData> maybeEventData = EventsRepository.getEventById(request.eventId(), Optional.of(transaction));

            if (maybeEventData.isEmpty()) {
                throw new RuntimeException("No event found for eventId: " + request.eventId());
            }

            EventData eventData = maybeEventData.get();
            if (eventData == null) {
                throw new RuntimeException("Event data is null");
            }

            String organiserId = EventsUtils.extractOrganiserIdForEvent(eventData);
            PrivateUserData privateUserData = Users.getPrivateUserDataById(organiserId, Optional.of(transaction));
            
            String stripeAccountId = validateAndGetStripeAccount(organiserId, privateUserData);

            commitReservation(transaction, request, eventData, privateUserData);
            logger.info("Reservation committed successfully for event {}", request.eventId());

            return new CheckoutTransactionResult(eventData, stripeAccountId);
        });

        // Section B: Create Stripe session (external I/O) with retries
        StripeSessionResult sessionResult = createStripeSessionWithRetries(request, checkoutTransactionResult.eventData(), checkoutTransactionResult.stripeAccountId());
        logger.info("Stripe session {} created successfully for event {}", 
                sessionResult.sessionId, checkoutTransactionResult.eventData().getEventId());

        logger.info("Checkout complete for event {}, organiser {}, account {}", 
                request.eventId(), EventsUtils.extractOrganiserIdForEvent(checkoutTransactionResult.eventData()), checkoutTransactionResult.stripeAccountId());

        return new CreateStripeCheckoutSessionResponse(sessionResult.checkoutUrl);
    }

    private static void validateEventForCheckout(EventData eventData, Integer quantity) throws Exception {
        // Validate event timing and status
        EventsUtils.validateEventTiming(eventData);
        
        if (!Boolean.TRUE.equals(eventData.getPaymentsActive())) {
            logger.error("Event " + eventData.getEventId() + " does not have payments enabled");
            throw new RuntimeException("Event " + eventData.getEventId() + " does not have payments enabled");
        }

        // Validate vacancy
        Integer vacancy = eventData.getVacancy();
        validateVacancy(eventData.getEventId(), vacancy, quantity);

        // Validate price
        Integer price = eventData.getPrice();
        if (price == null || (price < StripeService.MIN_PRICE_AMOUNT_FOR_STRIPE_CHECKOUT && price != 0)) {
            logger.error("Event " + eventData.getEventId() + " invalid price: " + price);
            throw new RuntimeException("Event " + eventData.getEventId() + " invalid price: " + price);
        }
    }

    /**
     * Validates event parameters and commits the reservation in a Firestore transaction.
     * 
     * @param transaction Firestore transaction
     * @param request Original checkout request - contains event ID, quantity, etc.
     * @param eventData Event data - contains event details
     * @param privateUserData Private user data - contains organiser details
     */
    private static void commitReservation(Transaction transaction, CreateStripeCheckoutSessionRequest request, EventData eventData, PrivateUserData privateUserData) throws Exception {
        validateEventForCheckout(eventData, request.quantity());

        Firestore db = FirebaseService.getFirestore();
        String organiserId = EventsUtils.extractOrganiserIdForEvent(eventData);

        DocumentReference eventRef = EventsUtils.getEventRef(db, request.eventId(), request.isPrivate());
        DocumentReference organiserRef = UsersUtils.getUserRef(db, organiserId);

        boolean needsActivation = Boolean.FALSE.equals(privateUserData.getStripeAccountActive());
        Integer currentVacancy = eventData.getVacancy();

        // PHASE 2: WRITE - Reserve tickets and track session
        Integer newVacancy = currentVacancy - request.quantity();
        transaction.update(eventRef, "vacancy", newVacancy);
        eventData.setVacancy(newVacancy);
        logger.info("Reserved {} tickets for event {} at {} cents (vacancy: {} -> {})",
                request.quantity(), request.eventId(), eventData.getPrice(), currentVacancy, newVacancy);
        
        // Activate Stripe account if needed
        if (needsActivation) {
            transaction.update(organiserRef, "stripeAccountActive", true);
            logger.info("Activated Stripe account for organiser {}", organiserId);
        }
    }

    /**
     * Reverts the ticket reservation in case of Stripe session creation failure.
     * 
     * @param request Original checkout request
     */
    private static void revertReservation(CreateStripeCheckoutSessionRequest request) {
        try {
            FirebaseService.createFirestoreTransaction(transaction -> {
                Firestore db = FirebaseService.getFirestore();
                DocumentReference eventRef = EventsUtils.getEventRef(db, request.eventId(), request.isPrivate());
                
                DocumentSnapshot eventSnapshot = transaction.get(eventRef).get();
                
                if (eventSnapshot.exists()) {
                    Long currentVacancy = eventSnapshot.getLong("vacancy");
                    if (currentVacancy != null) {
                        transaction.update(eventRef, "vacancy", currentVacancy + request.quantity());
                        logger.info("Reverted reservation of {} tickets for event {} (vacancy: {} -> {})", 
                                request.quantity(), request.eventId(), currentVacancy, currentVacancy + request.quantity());
                    }
                } else {
                    logger.error("Could not revert reservation: Event {} not found", request.eventId());
                    throw new RuntimeException("Could not revert reservation: Event " + request.eventId() + " not found");
                }
                return null;
            });
        } catch (Exception e) {
            logger.error("Failed to revert reservation for event {}: {}", request.eventId(), e.getMessage(), e);
            throw new RuntimeException("Failed to revert reservation: " + e.getMessage(), e);
        }
    }

    /**
     * Creates a Stripe checkout session with retries and backoff.
     * If all retries fail, it triggers a reservation revert.
     */
    private static StripeSessionResult createStripeSessionWithRetries(
            CreateStripeCheckoutSessionRequest request, EventData eventData, String stripeAccountId) {
        
        StripeSessionResult sessionResult = null;
        int maxRetries = 5;
        int retryCount = 0;
        long backoffMillis = 1000;
        boolean success = false;

        while (retryCount < maxRetries) {
            try {
                sessionResult = createStripeSession(request, eventData, stripeAccountId);
                success = true;
                break; 
            } catch (StripeException e) {
                retryCount++;
                logger.warn("Stripe session creation failed (attempt {}/{}), retrying in {}ms: {}", 
                        retryCount, maxRetries, backoffMillis, e.getMessage());
                
                if (retryCount >= maxRetries) {
                    logger.error("Max retries reached for Stripe session creation");
                    break;
                }

                try {
                    Thread.sleep(backoffMillis);
                } catch (InterruptedException ie) {
                     Thread.currentThread().interrupt();
                     break;
                }
                backoffMillis *= 2; 
            } catch (Exception e) {
                logger.error("Unexpected error during Stripe session creation: {}", e.getMessage(), e);
                break;
            }
        }

        if (!success || sessionResult == null) {
             logger.info("Reverting reservation due to Stripe session failure...");
             revertReservation(request);
             throw new RuntimeException("Stripe session creation failed and reservation was reverted.");
        }
        
        return sessionResult;
    }

    /**
     * Creates a Stripe checkout session OUTSIDE any transaction.
     */
    private static StripeSessionResult createStripeSession(
            CreateStripeCheckoutSessionRequest request, EventData eventData, String stripeAccountId) throws StripeException {
        
        // Build Stripe checkout session parameters
        SessionCreateParams.Builder paramsBuilder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency(StripeConfig.CURRENCY)
                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName(eventData.getName() != null ? eventData.getName() : "")
                                        .putMetadata("eventId", eventData.getEventId())
                                        .putMetadata("isPrivate", request.isPrivate().toString())
                                        .build())
                                .setUnitAmount((long) eventData.getPrice())
                                .build())
                        .setQuantity((long) request.quantity())
                        .build())
                .putMetadata("eventId", eventData.getEventId())
                .putMetadata("isPrivate", request.isPrivate().toString())
                .putMetadata("completeFulfilmentSession", request.completeFulfilmentSession().toString())
                .putMetadata("fulfilmentSessionId", 
                        request.fulfilmentSessionId() != null ? request.fulfilmentSessionId() : "")
                .putMetadata("endFulfilmentEntityId", 
                        request.endFulfilmentEntityId() != null ? request.endFulfilmentEntityId() : "")
                .addCustomField(SessionCreateParams.CustomField.builder()
                        .setKey("attendeeFullName")
                        .setLabel(SessionCreateParams.CustomField.Label.builder()
                                .setType(SessionCreateParams.CustomField.Label.Type.CUSTOM)
                                .setCustom("Full name for booking")
                                .build())
                        .setType(SessionCreateParams.CustomField.Type.TEXT)
                        .build())
                .addCustomField(SessionCreateParams.CustomField.builder()
                        .setKey("attendeePhone")
                        .setLabel(SessionCreateParams.CustomField.Label.builder()
                                .setType(SessionCreateParams.CustomField.Label.Type.CUSTOM)
                                .setCustom("Phone number")
                                .build())
                        .setType(SessionCreateParams.CustomField.Type.TEXT)
                        .build())
                .setSuccessUrl(request.successUrl())
                .setCancelUrl(request.cancelUrl())
                .setExpiresAt(Instant.now().getEpochSecond() + StripeConfig.CHECKOUT_SESSION_EXPIRY_SECONDS);

        // Add Stripe fee if passed to customer
        Boolean stripeFeeToCustomer = eventData.getStripeFeeToCustomer();
        if (stripeFeeToCustomer != null && Boolean.TRUE.equals(stripeFeeToCustomer) && eventData.getPrice() != 0) {
            long totalOrderPrice = (long) eventData.getPrice() * (long) request.quantity();
            long stripeFee = StripeConfig.calculateStripeFee(totalOrderPrice);
            logger.info("Stripe surcharge calculated: {} cents for event {} (price={}, quantity={})",
                    stripeFee, eventData.getEventId(), eventData.getPrice(), request.quantity());

            paramsBuilder.addShippingOption(SessionCreateParams.ShippingOption.builder()
                    .setShippingRateData(SessionCreateParams.ShippingOption.ShippingRateData.builder()
                            .setDisplayName("Stripe Card Surcharge Fees")
                            .setFixedAmount(SessionCreateParams.ShippingOption.ShippingRateData.FixedAmount.builder()
                                    .setAmount(stripeFee)
                                    .setCurrency(StripeConfig.CURRENCY)
                                    .build())
                            .setType(SessionCreateParams.ShippingOption.ShippingRateData.Type.FIXED_AMOUNT)
                            .build())
                    .build());
        }

        // Add promotional codes if enabled
        Boolean promotionalCodesEnabled = eventData.getPromotionalCodesEnabled();
        if (promotionalCodesEnabled != null && Boolean.TRUE.equals(promotionalCodesEnabled)) {
            paramsBuilder.setAllowPromotionCodes(true);
        }

        // Create Stripe checkout session with connected account
        SessionCreateParams params = paramsBuilder.build();
        
        Session session = Session.create(params, 
                com.stripe.net.RequestOptions.builder()
                        .setStripeAccount(stripeAccountId)
                        .build());

        logger.info("Created Stripe checkout session {} for event {}", session.getId(), eventData.getEventId());

        return new StripeSessionResult(session.getId(), session.getUrl());
    }

    /**
     * Validates that there are enough tickets available for the request.
     */
    private static void validateVacancy(String eventId, Integer vacancy, Integer quantity) throws CheckoutVacancyException {
        if (quantity == null || quantity <= 0) {
            logger.error("Event " + eventId + " invalid quantity: " + quantity);
            throw new RuntimeException("Event " + eventId + " invalid quantity: " + quantity);
        }
        if (vacancy == null) {
            logger.error("Event " + eventId + " missing vacancy field");
            throw new RuntimeException("Event " + eventId + " missing vacancy field");
        }
        
        if (vacancy < quantity) {
            logger.warn("Event " + eventId + " insufficient tickets: " + 
                    vacancy + " available, " + quantity + " requested");
            throw new CheckoutVacancyException("Event " + eventId + " insufficient tickets: " + 
                    vacancy + " available, " + quantity + " requested");
        }
    }

    /**
     * Performs Stripe API call if needed.
     * Returns the active Stripe account ID or throws exception.
     */
    private static String validateAndGetStripeAccount(String organiserId, PrivateUserData organiser) throws StripeException {
        try {
            if (organiser == null) {
                logger.error("Organiser " + organiserId + " data is null");
                throw new RuntimeException("Organiser " + organiserId + " data is null");
            }

            String stripeAccountId = organiser.getStripeAccount();
            if (stripeAccountId == null || stripeAccountId.isEmpty()) {
                logger.error("Organiser " + organiserId + " has no Stripe account");
                throw new RuntimeException("Organiser " + organiserId + " has no Stripe account");
            }

            // Only call Stripe API if account is marked inactive
            if (Boolean.FALSE.equals(organiser.getStripeAccountActive())) {
                Account account = Account.retrieve(stripeAccountId);
                if (!account.getChargesEnabled() || !account.getDetailsSubmitted()) {
                    logger.error("Stripe account " + stripeAccountId + " not ready: chargesEnabled=" + account.getChargesEnabled() + ", detailsSubmitted=" + account.getDetailsSubmitted());
                    throw new RuntimeException("Stripe account " + stripeAccountId + 
                            " not ready: chargesEnabled=" + account.getChargesEnabled() + 
                            ", detailsSubmitted=" + account.getDetailsSubmitted());
                }
                logger.info("Stripe account {} is active, will update in transaction", stripeAccountId);
            }

            return stripeAccountId;
        } catch (StripeException e) {
            logger.error("Stripe validation failed for organiser {}: {}", organiserId, e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            logger.error("Organiser validation failed for {}: {}", organiserId, e.getMessage(), e);
            throw e;
        }
    }
}
