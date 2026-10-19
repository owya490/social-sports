package com.functions.fulfilment.payment;

import java.util.List;

import com.functions.events.models.EventData;
import com.functions.events.models.PaymentProvider;

public final class PaymentProviderPolicy {
    private PaymentProviderPolicy() {
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
