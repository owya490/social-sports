package com.functions.stripe.services;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventData;
import com.functions.events.utils.EventsUtils;
import com.functions.firebase.services.FirebaseService;
import com.functions.stripe.config.StripeConfig;
import com.functions.stripe.exceptions.CheckoutDateTimeException;
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
     * Data transfer object holding transaction results needed for Stripe session creation.
     */
    private static class CheckoutTransactionResult {
        final String eventId;
        final String eventName;
        final Integer price;
        final Boolean stripeFeeToCustomer;
        final Boolean promotionalCodesEnabled;
        final String stripeAccountId;
        final String organiserId;
        final Integer quantity;
        final String reservationId; // For idempotency

        CheckoutTransactionResult(String eventId, String eventName, Integer price, 
                                 Boolean stripeFeeToCustomer, Boolean promotionalCodesEnabled,
                                 String stripeAccountId, String organiserId, Integer quantity,
                                 String reservationId) {
            this.eventId = eventId;
            this.eventName = eventName;
            this.price = price;
            this.stripeFeeToCustomer = stripeFeeToCustomer;
            this.promotionalCodesEnabled = promotionalCodesEnabled;
            this.stripeAccountId = stripeAccountId;
            this.organiserId = organiserId;
            this.quantity = quantity;
            this.reservationId = reservationId;
        }
    }

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
            StripeConfig.initialize();
            logger.info("Creating checkout session for event {} ({} tickets)", request.eventId(), request.quantity());

            // Validate Stripe account OUTSIDE transaction to avoid non-idempotent retries
            String organiserId = EventsUtils.fetchOrganiserIdForEvent(request.eventId(), request.isPrivate());
            String stripeAccountId = validateAndGetStripeAccount(organiserId);

            // Execute transaction: validate event, reserve tickets, activate account if needed
            CheckoutTransactionResult txResult = FirebaseService.createFirestoreTransaction(transaction -> {
                try {
                    return executeCheckoutTransaction(transaction, request, organiserId, stripeAccountId);
                } catch (CheckoutDateTimeException e) {
                    throw e; // Rethrow business exceptions
                } catch (Exception e) {
                    logger.error("Checkout transaction failed for event {}: {}", request.eventId(), e.getMessage(), e);
                    throw new RuntimeException("Checkout transaction failed: " + e.getMessage(), e);
                }
            });

            // Create Stripe session OUTSIDE transaction with idempotent key
            logger.info("Transaction committed for event {}. Creating Stripe session...", request.eventId());
            String checkoutUrl = createStripeCheckoutSession(txResult, request);
            
            logger.info("Checkout session created for event {}, organiser {}, account {}", 
                    request.eventId(), txResult.organiserId, txResult.stripeAccountId);
            
            return new CreateStripeCheckoutSessionResponse(checkoutUrl);
            
        } catch (StripeException e) {
            logger.error("Stripe session creation failed for event {}: {}", request.eventId(), e.getMessage(), e);
            throw new RuntimeException("Stripe session creation failed: " + e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Checkout failed for event {}: {}", request.eventId(), e.getMessage(), e);
            throw new RuntimeException("Checkout failed: " + e.getMessage(), e);
        }
    }

    /**
     * Executes the checkout transaction: validates event, reserves tickets, activates Stripe account if needed.
     * All reads must happen before writes to comply with Firestore transaction rules.
     * NO external I/O - only Firestore operations.
     * 
     * @param organiserId Pre-fetched organiser ID
     * @param stripeAccountId Pre-validated Stripe account ID
     * @return Transaction result containing data needed for Stripe session creation
     */
    private static CheckoutTransactionResult executeCheckoutTransaction(
            Transaction transaction, CreateStripeCheckoutSessionRequest request, 
            String organiserId, String stripeAccountId) throws Exception {
        
        Firestore db = FirebaseService.getFirestore();
        
        // PHASE 1: READ event and organiser
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

        // Verify event belongs to expected organiser
        if (!organiserId.equals(event.getOrganiserId())) {
            logger.error("Event " + request.eventId() + " organiser mismatch");
            throw new RuntimeException("Event " + request.eventId() + " organiser mismatch");
        }

        // Read organiser to check if Stripe account needs activation
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

        // Validate vacancy and price
        Integer vacancy = event.getVacancy();
        Integer price = event.getPrice();
        
        if (vacancy == null) {
            logger.error("Event " + request.eventId() + " missing vacancy field");
            throw new RuntimeException("Event " + request.eventId() + " missing vacancy field");
        }
        if (vacancy < request.quantity()) {
            logger.error("Event " + request.eventId() + " insufficient tickets: " + 
                    vacancy + " available, " + request.quantity() + " requested");
            throw new RuntimeException("Event " + request.eventId() + " insufficient tickets: " + 
                    vacancy + " available, " + request.quantity() + " requested");
        }
        if (price == null || (price < 1 && price != 0)) {
            logger.error("Event " + request.eventId() + " invalid price: " + price);
            throw new RuntimeException("Event " + request.eventId() + " invalid price: " + price);
        }

        // PHASE 2: WRITE - Reserve tickets and activate account
        transaction.update(eventRef, "vacancy", vacancy - request.quantity());
        
        if (needsActivation) {
            transaction.update(organiserRef, "stripeAccountActive", true);
            logger.info("Activated Stripe account for organiser {}", organiserId);
        }

        logger.info("Reserved {} tickets for event {} at {} cents (vacancy: {} -> {})",
                request.quantity(), request.eventId(), price, vacancy, vacancy - request.quantity());

        return new CheckoutTransactionResult(
                request.eventId(),
                event.getName(),
                price,
                event.getStripeFeeToCustomer(),
                event.getPromotionalCodesEnabled(),
                stripeAccountId,
                organiserId,
                request.quantity(),
                generateIdempotencyKey(request)
        );
    }

    /**
     * Creates a Stripe checkout session OUTSIDE the transaction.
     * This method performs external I/O and should never be called inside a Firestore transaction.
     * 
     * @param txResult Transaction result containing event and payment data
     * @param request Original checkout request
     * @return Stripe checkout session URL
     * @throws StripeException if Stripe API call fails
     */
    private static String createStripeCheckoutSession(
            CheckoutTransactionResult txResult, 
            CreateStripeCheckoutSessionRequest request) throws StripeException {
        
        // Build Stripe checkout session parameters
        SessionCreateParams.Builder paramsBuilder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency(StripeConfig.CURRENCY)
                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName(txResult.eventName != null ? txResult.eventName : "")
                                        .putMetadata("eventId", txResult.eventId)
                                        .putMetadata("isPrivate", request.isPrivate().toString())
                                        .build())
                                .setUnitAmount((long) txResult.price)
                                .build())
                        .setQuantity((long) txResult.quantity)
                        .build())
                .putMetadata("eventId", txResult.eventId)
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
        if (txResult.stripeFeeToCustomer != null && txResult.stripeFeeToCustomer && txResult.price != 0) {
            int totalOrderPrice = txResult.price * txResult.quantity;
            int stripeFee = StripeConfig.calculateStripeFee(totalOrderPrice);
            logger.info("Stripe surcharge calculated: {} cents for event {} (price={}, quantity={})",
                    stripeFee, txResult.eventId, txResult.price, txResult.quantity);

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
        if (txResult.promotionalCodesEnabled != null && txResult.promotionalCodesEnabled) {
            paramsBuilder.setAllowPromotionCodes(true);
        }

        // Create Stripe checkout session with connected account and idempotency key
        SessionCreateParams params = paramsBuilder.build();
        
        Session session = Session.create(params, 
                com.stripe.net.RequestOptions.builder()
                        .setStripeAccount(txResult.stripeAccountId)
                        .setIdempotencyKey(txResult.reservationId)
                        .build());

        logger.info("Created Stripe checkout session {} for event {}, reservation {}",
                session.getId(), txResult.eventId, txResult.reservationId);

        return session.getUrl();
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

    private static String generateIdempotencyKey(CreateStripeCheckoutSessionRequest request) {
        if (request.endFulfilmentEntityId() == null || request.fulfilmentSessionId() == null) {
            logger.error("End fulfilment entity ID and fulfilment session ID are required to generate idempotency key");
            throw new RuntimeException("End fulfilment entity ID and fulfilment session ID are required to generate idempotency key");
        }

        return String.format("idempotency_key_%s_%s_%s", 
            request.eventId(),
            request.endFulfilmentEntityId(),
            request.fulfilmentSessionId()
        );
    }
}

