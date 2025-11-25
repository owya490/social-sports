package com.functions.stripe.services;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventData;
import com.functions.events.utils.EventsUtils;
import com.functions.firebase.services.FirebaseService;
import com.functions.stripe.config.StripeConfig;
import com.functions.stripe.exceptions.CheckoutVacancyException;
import com.functions.stripe.models.requests.CreateStripeCheckoutSessionRequest;
import com.functions.stripe.models.responses.CreateStripeCheckoutSessionResponse;
import com.functions.users.models.PrivateUserData;
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
     * Data transfer object holding event data needed for Stripe session creation.
     * This is used only to pass data to the Stripe API, not for validation.
     */
    private static record EventValidationResult(String eventId, String eventName, Integer price, Boolean stripeFeeToCustomer, Boolean promotionalCodesEnabled, String stripeAccountId, String organiserId, Integer quantity) {}

    /**
     * Data transfer object holding Stripe session creation result.
     */
    private static class StripeSessionResult {
        final String sessionId;
        final String checkoutUrl;

        StripeSessionResult(String sessionId, String checkoutUrl) {
            this.sessionId = sessionId;
            this.checkoutUrl = checkoutUrl;
        }
    }

    /**
     * Creates a Stripe checkout session for an event.
     * Stripe session is created BEFORE committing Firestore updates to prevent 
     * stranded reservations if Stripe fails.
     *
     * Flow:
     * 1. Fail-fast validation (read-only transaction) - prevents unnecessary Stripe API calls
     * 2. Create Stripe checkout session (external I/O)
     * 3. Authoritative validation + commit (write transaction) - handles race conditions
     *
     * This two-phase validation approach:
     * - Phase 1: Quickly rejects obviously invalid requests (wrong timing, no vacancy, etc.)
     * - Phase 2: Creates Stripe session (external I/O)
     * - Phase 3: Re-validates transactionally to handle concurrent modifications
     *
     * @param request The checkout session request
     * @return Response containing the checkout URL
     */
    public static CreateStripeCheckoutSessionResponse createStripeCheckoutSession(
            CreateStripeCheckoutSessionRequest request) {
        try {
            StripeConfig.initialize();
            logger.info("Creating checkout session for event {} ({} tickets)", request.eventId(), request.quantity());

            // PHASE 1: Validate event and Stripe account (NO WRITES)
            String organiserId = EventsUtils.fetchOrganiserIdForEvent(request.eventId(), request.isPrivate());
            String stripeAccountId = validateAndGetStripeAccount(organiserId);
            EventValidationResult validationResult = validateEventForCheckout(request, organiserId, stripeAccountId);
            
            logger.info("Validated event {} for checkout (price: {}, quantity: {})", 
                    request.eventId(), validationResult.price, validationResult.quantity);

            // PHASE 2: Create Stripe session (external I/O, before any Firestore writes)
            StripeSessionResult sessionResult = createStripeSession(validationResult, request);
            logger.info("Stripe session {} created successfully for event {}", 
                    sessionResult.sessionId, request.eventId());

            // PHASE 3: Commit Firestore transaction to reserve tickets (only if Stripe succeeded)
            commitReservation(request, sessionResult.sessionId);
            
            logger.info("Checkout complete for event {}, organiser {}, account {}", 
                    request.eventId(), validationResult.organiserId, validationResult.stripeAccountId);
            
            return new CreateStripeCheckoutSessionResponse(sessionResult.checkoutUrl);
            
        } catch (StripeException e) {
            logger.error("Stripe session creation failed for event {}: {}", request.eventId(), e.getMessage(), e);
            throw new RuntimeException("Stripe session creation failed: " + e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Checkout failed for event {}: {}", request.eventId(), e.getMessage(), e);
            throw new RuntimeException("Checkout failed: " + e.getMessage(), e);
        }
    }

    /**
     * Reads and validates event data within a transaction.
     * Common logic for both fail-fast validation and authoritative commitment.
     */
    private static EventData validateAndGetEvent(Transaction transaction, CreateStripeCheckoutSessionRequest request) throws Exception {
        Firestore db = FirebaseService.getFirestore();
        
        // READ event data
        DocumentReference eventRef = EventsUtils.getEventRef(db, request.eventId(), request.isPrivate());
        DocumentSnapshot eventSnapshot = transaction.get(eventRef).get();

        if (!eventSnapshot.exists()) {
            logger.error("Event " + request.eventId() + " does not exist");
            throw new RuntimeException("Event " + request.eventId() + " does not exist");
        }

        EventData event = eventSnapshot.toObject(EventData.class);
        if (event == null) {
            logger.error("Event " + request.eventId() + " data is null");
            throw new RuntimeException("Event " + request.eventId() + " data is null");
        }

        // Validate event timing and status
        EventsUtils.validateEventTiming(event, request.eventId());
        
        if (!Boolean.TRUE.equals(event.getPaymentsActive())) {
            logger.error("Event " + request.eventId() + " does not have payments enabled");
            throw new RuntimeException("Event " + request.eventId() + " does not have payments enabled");
        }

        // Validate vacancy
        Integer vacancy = event.getVacancy();
        validateVacancy(request.eventId(), vacancy, request.quantity());

        // Validate price
        Integer price = event.getPrice();
        if (price == null || (price < 1 && price != 0)) {
            logger.error("Event " + request.eventId() + " invalid price: " + price);
            throw new RuntimeException("Event " + request.eventId() + " invalid price: " + price);
        }

        return event;
    }

    /**
     * Reads event data and performs fail-fast validation before creating Stripe session.
     * Uses a transaction to ensure consistent snapshot of event data.
     * 
     * Purpose: Prevent unnecessary Stripe API calls for requests that will definitely fail.
     * Note: commitReservation performs authoritative validation to handle race conditions.
     * 
     * @param organiserId Pre-fetched organiser ID
     * @param stripeAccountId Pre-validated Stripe account ID
     * @return Event data needed for Stripe session creation
     */
    private static EventValidationResult validateEventForCheckout(
            CreateStripeCheckoutSessionRequest request, 
            String organiserId, String stripeAccountId) throws Exception {
        
        // Use read-only transaction for consistent snapshot
        return FirebaseService.createFirestoreTransaction(transaction -> {
            try {
                EventData event = validateAndGetEvent(transaction, request);

                logger.info("Validated event {} for Stripe session: {} tickets at {} cents (vacancy: {})",
                        request.eventId(), request.quantity(), event.getPrice(), event.getVacancy());

                return new EventValidationResult(
                        request.eventId(),
                        event.getName(),
                        event.getPrice(),
                        event.getStripeFeeToCustomer(),
                        event.getPromotionalCodesEnabled(),
                        stripeAccountId,
                        organiserId,
                        request.quantity()
                );
            } catch (Exception e) {
                logger.error("Failed to validate event for checkout {}: {}", request.eventId(), e.getMessage(), e);
                throw new RuntimeException("Failed to validate event for checkout: " + e.getMessage(), e);
            }
        });
    }

    /**
     * Commits the reservation in a Firestore transaction AFTER Stripe session is created.
     * This is the AUTHORITATIVE validation - all checks happen here transactionally
     * based on current state. No dependency on prior reads.
     * 
     * @param request Original checkout request
     * @param stripeSessionId Stripe session ID to track successful reservations
     */
    private static void commitReservation(
            CreateStripeCheckoutSessionRequest request,
            String stripeSessionId) {
        
        FirebaseService.createFirestoreTransaction(transaction -> {
            try {
                Firestore db = FirebaseService.getFirestore();
                
                // PHASE 1: READ and VALIDATE event within transaction
                EventData event = validateAndGetEvent(transaction, request);

                // Restore local variables used in writes/logging
                DocumentReference eventRef = EventsUtils.getEventRef(db, request.eventId(), request.isPrivate());
                Integer vacancy = event.getVacancy();
                Integer price = event.getPrice();

                // Read organiser to check if Stripe account needs activation
                String organiserId = event.getOrganiserId();
                if (organiserId == null || organiserId.isEmpty()) {
                    logger.error("Event " + request.eventId() + " has no organiser ID");
                    throw new RuntimeException("Event " + request.eventId() + " has no organiser ID");
                }
                
                DocumentReference organiserRef = UsersUtils.getUserRef(db, organiserId);
                DocumentSnapshot organiserSnapshot = transaction.get(organiserRef).get();
                
                if (!organiserSnapshot.exists()) {
                    logger.error("Organiser " + organiserId + " does not exist");
                    throw new RuntimeException("Organiser " + organiserId + " does not exist");
                }
                
                PrivateUserData organiser = organiserSnapshot.toObject(PrivateUserData.class);
                if (organiser == null) {
                    logger.error("Organiser " + organiserId + " data is null");
                    throw new RuntimeException("Organiser " + organiserId + " data is null");
                }
                
                boolean needsActivation = Boolean.FALSE.equals(organiser.getStripeAccountActive());

                // PHASE 2: WRITE - Reserve tickets and track session
                transaction.update(eventRef, "vacancy", vacancy - request.quantity());
                logger.info("Reserved {} tickets for event {} at {} cents (vacancy: {} -> {})",
                        request.quantity(), request.eventId(), price, vacancy, vacancy - request.quantity());
                
                // Activate Stripe account if needed
                if (needsActivation) {
                    transaction.update(organiserRef, "stripeAccountActive", true);
                    logger.info("Activated Stripe account for organiser {}", organiserId);
                }
                
                return null;
            } catch (Exception e) {
                logger.error("Reservation commit failed for event {}: {}", request.eventId(), e.getMessage(), e);
                throw new RuntimeException("Reservation commit failed: " + e.getMessage(), e);
            }
        });
    }

    /**
     * Creates a Stripe checkout session OUTSIDE any transaction.
     * This method performs external I/O and is called BEFORE committing Firestore writes.
     * 
     * @param validationResult Event data for Stripe session creation
     * @param request Original checkout request
     * @return Stripe session result containing session ID and checkout URL
     * @throws StripeException if Stripe API call fails
     */
    private static StripeSessionResult createStripeSession(
            EventValidationResult validationResult, 
            CreateStripeCheckoutSessionRequest request) throws StripeException {
        
        // Build Stripe checkout session parameters
        SessionCreateParams.Builder paramsBuilder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency(StripeConfig.CURRENCY)
                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName(validationResult.eventName != null ? validationResult.eventName : "")
                                        .putMetadata("eventId", validationResult.eventId)
                                        .putMetadata("isPrivate", request.isPrivate().toString())
                                        .build())
                                .setUnitAmount((long) validationResult.price)
                                .build())
                        .setQuantity((long) validationResult.quantity)
                        .build())
                .putMetadata("eventId", validationResult.eventId)
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
        if (validationResult.stripeFeeToCustomer != null && validationResult.stripeFeeToCustomer && validationResult.price != 0) {
            long totalOrderPrice = (long) validationResult.price * (long) validationResult.quantity;
            long stripeFee = StripeConfig.calculateStripeFee(totalOrderPrice);
            logger.info("Stripe surcharge calculated: {} cents for event {} (price={}, quantity={})",
                    stripeFee, validationResult.eventId, validationResult.price, validationResult.quantity);

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
        if (validationResult.promotionalCodesEnabled != null && validationResult.promotionalCodesEnabled) {
            paramsBuilder.setAllowPromotionCodes(true);
        }

        // Create Stripe checkout session with connected account
        SessionCreateParams params = paramsBuilder.build();
        
        Session session = Session.create(params, 
                com.stripe.net.RequestOptions.builder()
                        .setStripeAccount(validationResult.stripeAccountId)
                        .build());

        logger.info("Created Stripe checkout session {} for event {}", session.getId(), validationResult.eventId);

        return new StripeSessionResult(session.getId(), session.getUrl());
    }

    /**
     * Validates that there are enough tickets available for the request.
     * 
     * @param eventId The ID of the event
     * @param vacancy The current vacancy count
     * @param quantity The requested quantity
     * @throws CheckoutVacancyException if insufficient tickets
     */
    private static void validateVacancy(String eventId, Integer vacancy, Integer quantity) throws CheckoutVacancyException {
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
     * Validates Stripe account OUTSIDE transaction. Performs Stripe API call if needed.
     * Returns the active Stripe account ID or throws exception.
     */
    private static String validateAndGetStripeAccount(String organiserId) throws StripeException {
        try {
            Firestore db = FirebaseService.getFirestore();
            DocumentSnapshot organiserSnapshot = UsersUtils.getUserRef(db, organiserId).get().get();

            if (!organiserSnapshot.exists()) {
                logger.error("Organiser " + organiserId + " does not exist");
                throw new RuntimeException("Organiser " + organiserId + " does not exist");
            }

            PrivateUserData organiser = organiserSnapshot.toObject(PrivateUserData.class);
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
            throw new RuntimeException("Organiser validation failed: " + e.getMessage(), e);
        }
    }
}
