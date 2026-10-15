package com.functions.fulfilment.payment;

import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;

public interface PaymentFulfilmentStep {
    void start(String fulfilmentSessionId, FulfilmentSession session, String fulfilmentEntityId) throws Exception;
}
