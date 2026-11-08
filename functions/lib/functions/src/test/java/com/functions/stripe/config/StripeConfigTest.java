package com.functions.stripe.config;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class StripeConfigTest {
    private static final String EXEMPT_ORGANISER_ID = "KOy7g8V970QGRW0dlJdrf6zSmiV2";
    private static final String STANDARD_ORGANISER_ID = "organiser-1";

    @Test
    public void stripeFeeIsOnePointSixFivePercentPlusThirtyCentsForExemptOrganisers() {
        // $100.00 -> 30c + 1.65% = 195c
        assertEquals(195L, StripeConfig.calculateStripeFee(10_000L, EXEMPT_ORGANISER_ID));
        // 1001c does not divide evenly, so the fee rounds up.
        assertEquals(47L, StripeConfig.calculateStripeFee(1_001L, EXEMPT_ORGANISER_ID));
    }

    @Test
    public void stripeFeeAddsTheOnePercentSportsHubFeeForStandardOrganisers() {
        // $100.00 -> 30c + 1.65% Stripe + 1% SportsHub = 295c
        assertEquals(295L, StripeConfig.calculateStripeFee(10_000L, STANDARD_ORGANISER_ID));
        assertEquals(57L, StripeConfig.calculateStripeFee(1_001L, STANDARD_ORGANISER_ID));
        assertEquals(100L, StripeConfig.calculateSportsHubFee(10_000L, STANDARD_ORGANISER_ID));
        assertEquals(0L, StripeConfig.calculateSportsHubFee(10_000L, EXEMPT_ORGANISER_ID));
    }
}
