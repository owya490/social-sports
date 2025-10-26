package com.functions.stripe.config;

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

    // Feature flag for easily gating Java implementation of Python Stripe functionality.
    public static final boolean JAVA_STRIPE_ENABLED = true;

    public static final String ERROR_URL = "/error";
    public static final String CURRENCY = "aud";
    public static final int CHECKOUT_SESSION_EXPIRY_SECONDS = 1800; // 30 minutes

    // Stripe fee calculation constants
    private static final int STRIPE_FIXED_FEE_CENTS = 30;
    private static final double STRIPE_PERCENTAGE_FEE = 0.017; // 1.7%

    static {
        try {
            String stripeApiKey = Global.getEnv("STRIPE_API_KEY");
            if (stripeApiKey == null || stripeApiKey.isEmpty()) {
                logger.error("STRIPE_API_KEY environment variable is not set");
                throw new RuntimeException("STRIPE_API_KEY environment variable is not set");
            }
            Stripe.apiKey = stripeApiKey;
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
    public static int calculateStripeFee(int priceInCents) {
        return (int) Math.ceil(STRIPE_FIXED_FEE_CENTS + (priceInCents * STRIPE_PERCENTAGE_FEE));
    }

    /**
     * Ensures the StripeConfig class is loaded, triggering static initialization if not already done.
     * <p>
     * This method attempts to force class loading, which will execute the static initialization block
     * that sets up the Stripe API key. If the class is already loaded, this is a no-op.
     * </p>
     * <p>
     * Note: The actual initialization happens in the static block and is logged there.
     * This method exists primarily as an explicit way to trigger class loading.
     * </p>
     */
    public static void ensureClassLoaded() {
        // Static initialization block will have already executed by the time this method is called.
        // This method serves only to trigger class loading if not already loaded.
    }
}

