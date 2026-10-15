package com.functions.fulfilment.pyng;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.fulfilment.models.fulfilmentSession.PyngCheckoutFulfilmentSession;
import com.functions.fulfilment.models.fulfilmentSession.PyngMetadata;
import com.functions.fulfilment.payment.PaymentStatus;

/**
 * Shell for the Pyng hosted-checkout API. Request and response mapping stays
 * here until the Pyng docs are wired in.
 */
public final class PyngService {
    private static final Logger logger = LoggerFactory.getLogger(PyngService.class);

    private PyngService() {
    }

    public static PyngHostedCheckout createHostedCheckout(PyngCheckoutFulfilmentSession session) {
        logger.info("Pyng hosted checkout creation is not implemented yet for event {}",
                session.getEventData() == null ? null : session.getEventData().getEventId());
        throw new UnsupportedOperationException("Pyng hosted checkout creation is not implemented yet");
    }

    public static PaymentStatus pollCheckout(PyngMetadata metadata) {
        logger.info("Pyng checkout poll is not implemented yet for checkout session {}",
                metadata == null ? null : metadata.getCheckoutSessionId());
        return PaymentStatus.PENDING;
    }
}
