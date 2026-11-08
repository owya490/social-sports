package com.functions.fulfilment.models.fulfilmentEntities;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntity.FulfilmentEntityHookInput;
import com.functions.fulfilment.models.fulfilmentSession.CheckoutFulfilmentSession;
import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;
import com.functions.fulfilment.models.fulfilmentSession.PyngCheckoutFulfilmentSession;
import com.functions.fulfilment.models.fulfilmentSession.PyngMetadata;
import com.functions.fulfilment.payment.PaymentStatus;

public class PyngFulfilmentEntityTest {

    @Test
    public void onEndHookAllowsTerminalPaymentStatuses() {
        assertTrue(complete(sessionWithStatus(PaymentStatus.SUCCEEDED)));
        assertTrue(complete(sessionWithStatus(PaymentStatus.EXPIRED)));
    }

    @Test
    public void onEndHookBlocksPendingOrMissingPayment() {
        assertFalse(complete(sessionWithStatus(PaymentStatus.PENDING)));
        assertFalse(complete(PyngCheckoutFulfilmentSession.builder().id("session-1").build()));
        assertFalse(complete(PyngCheckoutFulfilmentSession.builder()
                .id("session-1")
                .pyngMetadata(PyngMetadata.builder().checkoutSessionId("checkout-1").build())
                .build()));
    }

    @Test
    public void onEndHookBlocksNonPyngSession() {
        assertFalse(complete(CheckoutFulfilmentSession.builder().id("session-1").build()));
    }

    private static boolean complete(FulfilmentSession session) {
        PyngFulfilmentEntity entity = PyngFulfilmentEntity.builder().build();
        return entity.onEndHook().orElseThrow()
                .apply(new FulfilmentEntityHookInput("entity-1", session));
    }

    private static PyngCheckoutFulfilmentSession sessionWithStatus(PaymentStatus status) {
        return PyngCheckoutFulfilmentSession.builder()
                .id("session-1")
                .pyngMetadata(PyngMetadata.builder()
                        .checkoutSessionId("checkout-1")
                        .status(status)
                        .build())
                .build();
    }
}
