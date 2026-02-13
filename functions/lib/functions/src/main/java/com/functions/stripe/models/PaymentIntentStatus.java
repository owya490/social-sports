package com.functions.stripe.models;

/**
 * Enum representing Stripe PaymentIntent statuses relevant to booking approval.
 * 
 * @see <a href=
 *      "https://docs.stripe.com/api/payment_intents/object#payment_intent_object-status">Stripe
 *      PaymentIntent Status</a>
 */
public enum PaymentIntentStatus {
    REQUIRES_CAPTURE("requires_capture"),
    CANCELED("canceled");

    private final String stripeStatus;

    PaymentIntentStatus(String stripeStatus) {
        this.stripeStatus = stripeStatus;
    }

    public String getStripeStatus() {
        return stripeStatus;
    }

    /**
     * Checks if the given Stripe status string matches this enum value.
     */
    public boolean matches(String status) {
        return stripeStatus.equals(status);
    }
}
