package com.functions.fulfilment.handlers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.fulfilment.models.requests.RefreshPyngCheckoutRequest;
import com.functions.fulfilment.models.responses.RefreshPyngCheckoutResponse;
import com.functions.fulfilment.payment.PaymentStatus;
import com.functions.fulfilment.pyng.PyngCheckoutCompletion;
import com.functions.global.models.AuthContext;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;

public class RefreshPyngCheckoutHandler implements Handler<RefreshPyngCheckoutRequest, RefreshPyngCheckoutResponse> {
    private static final Logger logger = LoggerFactory.getLogger(RefreshPyngCheckoutHandler.class);

    @Override
    public RefreshPyngCheckoutRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), RefreshPyngCheckoutRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse RefreshPyngCheckoutRequest", e);
        }
    }

    @Override
    public RefreshPyngCheckoutResponse handle(RefreshPyngCheckoutRequest request, AuthContext authContext)
            throws Exception {
        if (request == null || request.fulfilmentSessionId() == null || request.fulfilmentSessionId().isBlank()) {
            throw new IllegalArgumentException("Fulfilment session ID is required");
        }
        logger.info("Refreshing Pyng checkout for fulfilment session {}", request.fulfilmentSessionId());
        PaymentStatus status = PyngCheckoutCompletion.refresh(request.fulfilmentSessionId());
        return new RefreshPyngCheckoutResponse(status);
    }
}
