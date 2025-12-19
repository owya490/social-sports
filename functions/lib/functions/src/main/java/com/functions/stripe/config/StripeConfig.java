package com.functions.stripe.config;

import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.global.handlers.Global;
import com.stripe.Stripe;

/**
 * Configuration class for Stripe integration.
 * Handles initialization of Stripe API key and constants.
 */
public class StripeConfig {
    private static final Logger logger = LoggerFactory.getLogger(StripeConfig.class);

    // Feature flags for easily gating Java implementation of Python Stripe functionality.
    public static final boolean JAVA_STRIPE_ENABLED = false;
    public static final boolean JAVA_STRIPE_WEBHOOK_ENABLED = true;

    public static final String ERROR_URL = "/error";
    public static final String CURRENCY = "aud";
    public static final int CHECKOUT_SESSION_EXPIRY_SECONDS = 1800; // 30 minutes

    private static final Set<String> SPORTSHUB_FEE_ACCOUNTS = Set.of(
        "obodlRDZycR062927qTjsah0FHr2", // Acers Prod
        "PT57cJxfbdRXOQgJH2nAs6cZnFH3", // OneU (Ricky Tang) Prod
        "c5vFAZ3NlSXVuHGrwlkCjJr3RXX2" // Owen Dev
    );

    private static final double SPORTSHUB_FEE_PERCENTAGE = 0.01; // 1%

    // Stripe fee calculation constants
    private static final int STRIPE_FIXED_FEE_CENTS = 30;
    private static final double STRIPE_PERCENTAGE_FEE = 0.017; // 1.7%

    // Webhook configuration
    public static final String STRIPE_WEBHOOK_ENDPOINT_SECRET = Global.getEnv("STRIPE_WEBHOOK_ENDPOINT_SECRET");

    private static boolean initialized = false;

    /**
     * Explicitly initializes Stripe configuration with the API key.
     * 
     * @throws IllegalStateException if STRIPE_API_KEY environment variable is not set
     * @throws RuntimeException if initialization fails
     */
    public static void initialize() {
        if (initialized) {
            logger.info("Stripe configuration already initialized");
            return;
        }

        logger.info("Initializing Stripe configuration");

        try {
            String stripeApiKey = Global.getEnv("STRIPE_API_KEY");
            if (stripeApiKey == null || stripeApiKey.isEmpty()) {
                logger.error("STRIPE_API_KEY environment variable is not set");
                throw new IllegalStateException("STRIPE_API_KEY environment variable is not set");
            }
            Stripe.apiKey = stripeApiKey;
            initialized = true;
            logger.info("Stripe API key initialized successfully");
        } catch (Exception e) {
            logger.error("Failed to initialize Stripe configuration", e);
            throw new RuntimeException("Failed to initialize Stripe configuration", e);
        }
    }

    /**
     * Calculates the Stripe fee for a given price.
     * Stripe fee is 30c + 1.7% of total price.
     * 
     * @param priceInCents The price in cents
     * @return The Stripe fee in cents
     */
    public static long calculateStripeFee(long priceInCents, String organiserId) {
        if (SPORTSHUB_FEE_ACCOUNTS.contains(organiserId)) {
            logger.info("Organiser {} is part of the FEE accounts. Adding {} to the fee percentage. Dynamic fee is {}", organiserId, SPORTSHUB_FEE_PERCENTAGE, (long) Math.ceil(STRIPE_FIXED_FEE_CENTS + (priceInCents * (STRIPE_PERCENTAGE_FEE + SPORTSHUB_FEE_PERCENTAGE))));
            return (long) Math.ceil(STRIPE_FIXED_FEE_CENTS + (priceInCents * (STRIPE_PERCENTAGE_FEE + SPORTSHUB_FEE_PERCENTAGE)));
        }
        return (long) Math.ceil(STRIPE_FIXED_FEE_CENTS + (priceInCents * STRIPE_PERCENTAGE_FEE));
    }

    public static long calculateSportsHubFee(long priceInCents, String organiserId) {
        // if the organiser is part of the FEE accounts, add the application percentage to the fee
        if (SPORTSHUB_FEE_ACCOUNTS.contains(organiserId)) {
            return (long) Math.ceil(priceInCents * SPORTSHUB_FEE_PERCENTAGE);
        }
        return 0;
    }
}

