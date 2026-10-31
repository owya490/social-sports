package com.functions.fulfilment.handlers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.fulfilment.models.requests.UpdateFulfilmentPurchaserRequest;
import com.functions.fulfilment.models.responses.UpdateFulfilmentPurchaserResponse;
import com.functions.fulfilment.services.PurchaserDetailsService;
import com.functions.global.models.AuthContext;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;

public class UpdateFulfilmentPurchaserHandler
        implements Handler<UpdateFulfilmentPurchaserRequest, UpdateFulfilmentPurchaserResponse> {
    private static final Logger logger = LoggerFactory.getLogger(UpdateFulfilmentPurchaserHandler.class);

    @Override
    public UpdateFulfilmentPurchaserRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), UpdateFulfilmentPurchaserRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse UpdateFulfilmentPurchaserRequest", e);
        }
    }

    @Override
    public UpdateFulfilmentPurchaserResponse handle(UpdateFulfilmentPurchaserRequest request, AuthContext authContext)
            throws Exception {
        if (request == null || request.fulfilmentSessionId() == null || request.fulfilmentEntityId() == null
                || request.name() == null || request.email() == null) {
            throw new IllegalArgumentException(
                    "Fulfilment session ID, fulfilment entity ID, name, and email are required");
        }
        logger.info("Saving purchaser details for fulfilment session {} entity {}",
                request.fulfilmentSessionId(), request.fulfilmentEntityId());
        PurchaserDetailsService.save(request.fulfilmentSessionId(), request.fulfilmentEntityId(),
                request.name(), request.email());
        return new UpdateFulfilmentPurchaserResponse(true, "Purchaser details saved");
    }
}
