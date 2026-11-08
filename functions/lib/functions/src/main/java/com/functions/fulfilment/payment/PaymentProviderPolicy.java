package com.functions.fulfilment.payment;

import java.util.List;
import java.util.Set;

import com.functions.events.models.EventData;
import com.functions.events.models.PaymentProvider;

public final class PaymentProviderPolicy {
    /** Launch allowlist. The organiser id is read from the stored event, not the client. */
    private static final Set<String> PYNG_CHECKOUT_ORGANISER_IDS = Set.of(
            "ZzuRS5v8hhWonnp2qdIOZG8R7f12"); // sportshub prod

    private PaymentProviderPolicy() {
    }

    public static boolean allowsPyngCheckout(EventData event) {
        return event != null && event.getOrganiserId() != null
                && PYNG_CHECKOUT_ORGANISER_IDS.contains(event.getOrganiserId());
    }

    public static List<PaymentProvider> supportedPaymentProviders(EventData event) {
        List<PaymentProvider> configured = event.getSupportedPaymentProviders();
        return configured == null || configured.contains(PaymentProvider.STRIPE)
                ? List.of(PaymentProvider.STRIPE) : List.of();
    }

    public static boolean supportsStripe(EventData event) {
        return supportedPaymentProviders(event).contains(PaymentProvider.STRIPE);
    }
}
