package com.functions.stripe.services;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventData;
import com.functions.firebase.services.FirebaseService;
import com.functions.firebase.services.FirebaseService.CollectionPaths;
import com.functions.stripe.config.StripeConfig;
import com.functions.stripe.exceptions.CheckoutDateTimeException;
import com.functions.stripe.models.requests.CreateStripeCheckoutSessionRequest;
import com.functions.stripe.models.responses.CreateStripeCheckoutSessionResponse;
import com.functions.users.models.PrivateUserData;
import com.google.cloud.Timestamp;
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
     * Creates a Stripe checkout session for an event within a Firestore transaction.
     * This ensures atomic updates to event vacancy and Stripe account status.
     *
     * @param request The checkout session request
     * @return Response containing the checkout URL or error URL
     */
    public static CreateStripeCheckoutSessionResponse createStripeCheckoutSession(
            CreateStripeCheckoutSessionRequest request) {
        try {
            // Explicitly initialize Stripe configuration if not already done
            StripeConfig.initialize();

            request.validate();

            logger.info("Creating stripe checkout session for event {} for {} tickets.",
                    request.eventId(), request.quantity());

            // Run the entire checkout process in a Firestore transaction to ensure atomicity of updates.
            CreateStripeCheckoutSessionResponse response = FirebaseService.createFirestoreTransaction(transaction -> {
                try {
                    return createCheckoutSessionInTransaction(transaction, request);
                } catch (Exception e) {
                    if (e instanceof CheckoutDateTimeException) {
                        throw e;
                    }

                    logger.error("Error in checkout transaction for event {}: {}", 
                            request.eventId(), e.getMessage(), e);
                    throw new RuntimeException("Checkout transaction failed", e);
                }
            });

            return response;
        } catch (Exception e) {
            logger.error("Failed to create checkout session for event {}: {}", 
                    request.eventId(), e.getMessage(), e);
            throw new RuntimeException("Failed to create checkout session", e);
        }
    }

    /**
     * Creates a checkout session within a Firestore transaction.
     * All reads must happen before writes to comply with Firestore transaction rules.
     */
    private static CreateStripeCheckoutSessionResponse createCheckoutSessionInTransaction(
            Transaction transaction, CreateStripeCheckoutSessionRequest request) throws Exception {
        
        Firestore db = FirebaseService.getFirestore();
        String privacyPath = request.isPrivate() ? CollectionPaths.PRIVATE : CollectionPaths.PUBLIC;
        
        // PHASE 1: PERFORM ALL READS FIRST

        // Read 1: Get event document
        DocumentReference eventRef = db.collection(CollectionPaths.EVENTS + "/" + CollectionPaths.ACTIVE + "/" + privacyPath)
                .document(request.eventId());
        DocumentSnapshot eventSnapshot = transaction.get(eventRef).get();

        if (!eventSnapshot.exists()) {
            logger.error("Event {} does not exist in path {}", request.eventId(), eventRef.getPath());
            throw new RuntimeException("Event does not exist in path " + eventRef.getPath());
        }

        EventData event = eventSnapshot.toObject(EventData.class);
        if (event == null) {
            logger.error("Event {} data is null", request.eventId());
            throw new RuntimeException("Event data is null for event ID: " + request.eventId());
        }

        logger.info("Event info retrieved for {}", request.eventId());

        // Validate event is not paused, concluded, or past registration deadline
        Boolean paused = event.getPaused() != null ? event.getPaused() : false;
        Timestamp endDate = event.getEndDate();
        Timestamp registrationDeadline = event.getRegistrationDeadline();

        if (endDate == null || registrationDeadline == null) {
            logger.error("Event {} is missing required date fields", request.eventId());
            throw new RuntimeException("Event is missing required date fields for event ID: " + request.eventId());
        }

        Instant now = Instant.now();
        Instant eventEndInstant = Instant.ofEpochSecond(endDate.getSeconds(), endDate.getNanos());
        Instant registrationEndInstant = Instant.ofEpochSecond(
                registrationDeadline.getSeconds(), registrationDeadline.getNanos());

        if (now.isAfter(eventEndInstant) || now.isAfter(registrationEndInstant) || paused) {
            logger.warn("Cannot checkout for event {}: concluded={}, past registration={}, paused={}",
                    request.eventId(), now.isAfter(eventEndInstant), 
                    now.isAfter(registrationEndInstant), paused);
            throw new CheckoutDateTimeException("Cannot checkout for event " + request.eventId() + ": concluded=" + now.isAfter(eventEndInstant) + ", past registration=" + now.isAfter(registrationEndInstant) + ", paused=" + paused);
        }

        // Check payments are active
        Boolean paymentsActive = event.getPaymentsActive();
        if (paymentsActive == null || !paymentsActive) {
            logger.error("Event {} does not have payments enabled", request.eventId());
            throw new RuntimeException("Event " + request.eventId() + " does not have payments enabled");
        }

        // Read 2: Get organiser document
        String organiserId = event.getOrganiserId();
        if (organiserId == null || organiserId.isEmpty()) {
            logger.error("Event {} is missing organiserId", request.eventId());
            throw new RuntimeException("Event " + request.eventId() + " is missing organiserId");
        }

        DocumentReference organiserRef = db.collection(CollectionPaths.USERS + "/" + CollectionPaths.ACTIVE + "/" + CollectionPaths.PRIVATE).document(organiserId);
        DocumentSnapshot organiserSnapshot = transaction.get(organiserRef).get();

        if (!organiserSnapshot.exists()) {
            logger.error("Organiser {} does not exist", organiserId);
            throw new RuntimeException("Organiser " + organiserId + " does not exist");
        }

        PrivateUserData organiser = organiserSnapshot.toObject(PrivateUserData.class);
        if (organiser == null) {
            logger.error("Organiser {} data is null", organiserId);
            throw new RuntimeException("Organiser " + organiserId + " data is null");
        }

        // Check organiser has Stripe account
        String stripeAccountId = organiser.getStripeAccount();
        if (stripeAccountId == null || stripeAccountId.isEmpty()) {
            logger.error("Organiser {} does not have a Stripe account", organiserId);
            throw new RuntimeException("Organiser " + organiserId + " does not have a Stripe account");
        }

        // Check if Stripe account is active
        Boolean stripeAccountActive = organiser.getStripeAccountActive();
        boolean needsActivation = false;
        
        if (stripeAccountActive != null && stripeAccountActive == false) {
            // Double check with Stripe API if account is actually active
            try {
                Account account = Account.retrieve(stripeAccountId);
                if (account.getChargesEnabled() && account.getDetailsSubmitted()) {
                    logger.info("Organiser {} has charges enabled and details submitted. Activating account.",
                            organiserId);
                    needsActivation = true;
                } else {
                    logger.error("Organiser {} Stripe account not active: chargesEnabled={}, detailsSubmitted={}",
                            organiserId, account.getChargesEnabled(), account.getDetailsSubmitted());
                    throw new RuntimeException("Organiser " + organiserId + " Stripe account not active: chargesEnabled=" + account.getChargesEnabled() + ", detailsSubmitted=" + account.getDetailsSubmitted());
                }
            } catch (StripeException e) {
                logger.error("Failed to retrieve Stripe account {} for organiser {}: {}",
                        stripeAccountId, organiserId, e.getMessage(), e);
                throw new RuntimeException("Failed to retrieve Stripe account " + stripeAccountId + " for organiser " + organiserId + ": " + e.getMessage(), e);
            }
        }

        // Check vacancy
        Integer vacancy = event.getVacancy();
        if (vacancy == null) {
            logger.error("Event {} is missing vacancy field. Returning status=500", request.eventId());
            throw new RuntimeException("Event " + request.eventId() + " is missing vacancy field");
        }

        if (vacancy < request.quantity()) {
            logger.warn("Event {} does not have enough tickets: requested={}, available={}",
                    request.eventId(), request.quantity(), vacancy);
            throw new RuntimeException("Event " + request.eventId() + " does not have enough tickets: requested=" + request.quantity() + ", available=" + vacancy);
        }

        // Check price
        Integer price = event.getPrice();
        if (price == null || (price < 100 && price != 0)) { // we don't want events to be less than stripe fees
            logger.error("Event {} does not have a valid price: {}", request.eventId(), price);
            throw new RuntimeException("Event " + request.eventId() + " does not have a valid price: " + price);
        }

        // PHASE 2: PERFORM ALL WRITES

        // Write 1: Update vacancy (secure tickets)
        int newVacancy = vacancy - request.quantity();
        transaction.update(eventRef, "vacancy", newVacancy);
        logger.info("Securing {} tickets for event {} at {} cents. Remaining tickets: {}",
                request.quantity(), request.eventId(), price, newVacancy);

        // Write 2: Activate Stripe account if needed
        if (needsActivation) {
            transaction.update(organiserRef, "stripeAccountActive", true);
            logger.info("Activated Stripe account for organiser {}", organiserId);
        }

        // PHASE 3: CREATE STRIPE CHECKOUT SESSION (after transaction reads/writes)
        
        // Build Stripe checkout session parameters
        SessionCreateParams.Builder paramsBuilder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency(StripeConfig.CURRENCY)
                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName(event.getName() != null ? event.getName() : "")
                                        .putMetadata("eventId", request.eventId())
                                        .putMetadata("isPrivate", request.isPrivate().toString())
                                        .build())
                                .setUnitAmount((long) price)
                                .build())
                        .setQuantity((long) request.quantity())
                        .build())
                .putMetadata("eventId", request.eventId())
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
        Boolean stripeFeeToCustomer = event.getStripeFeeToCustomer();
        if (stripeFeeToCustomer != null && stripeFeeToCustomer && price != 0) {
            int totalOrderPrice = price * request.quantity();
            int stripeFee = StripeConfig.calculateStripeFee(totalOrderPrice);
            logger.info("Stripe surcharge calculated: {} cents for event {} (price={}, quantity={})",
                    stripeFee, request.eventId(), price, request.quantity());

            paramsBuilder.addShippingOption(SessionCreateParams.ShippingOption.builder()
                    .setShippingRateData(SessionCreateParams.ShippingOption.ShippingRateData.builder()
                            .setDisplayName("Stripe Card Surcharge Fees")
                            .setFixedAmount(SessionCreateParams.ShippingOption.ShippingRateData.FixedAmount.builder()
                                    .setAmount((long) stripeFee)
                                    .setCurrency(StripeConfig.CURRENCY)
                                    .build())
                            .setType(SessionCreateParams.ShippingOption.ShippingRateData.Type.FIXED_AMOUNT)
                            .build())
                    .build());
        }

        // Add promotional codes if enabled
        Boolean promotionalCodesEnabled = event.getPromotionalCodesEnabled();
        if (promotionalCodesEnabled != null && promotionalCodesEnabled) {
            paramsBuilder.setAllowPromotionCodes(true);
        }

        // Create Stripe checkout session with connected account
        SessionCreateParams params = paramsBuilder.build();
        
        try {
            Session session = Session.create(params, 
                    com.stripe.net.RequestOptions.builder()
                            .setStripeAccount(stripeAccountId)
                            .setIdempotencyKey(generateIdempotencyKey(request))
                            .build());

            logger.info("Created checkout session {} for event {}, linked to organiser {} and Stripe account {}. Secured {} tickets at {} cents",
                    session.getId(), request.eventId(), organiserId, stripeAccountId, 
                    request.quantity(), price);

            return new CreateStripeCheckoutSessionResponse(session.getUrl());
        } catch (StripeException e) {
            logger.error("Failed to create Stripe checkout session for event {}: {}",
                    request.eventId(), e.getMessage(), e);
            throw new RuntimeException("Failed to create Stripe checkout session for event " + request.eventId() + ": " + e.getMessage(), e);
        }
    }

    private static String generateIdempotencyKey(CreateStripeCheckoutSessionRequest request) {
        if (request.endFulfilmentEntityId() == null || request.fulfilmentSessionId() == null) {
            throw new RuntimeException("End fulfilment entity ID and fulfilment session ID are required");
        }

        return String.format("idempotency_key_%s_%s_%s", 
            request.eventId(),
            request.endFulfilmentEntityId(),
            request.fulfilmentSessionId()
        );
    }
}

