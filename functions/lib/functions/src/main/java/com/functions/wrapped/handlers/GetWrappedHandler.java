package com.functions.wrapped.handlers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;
import com.functions.wrapped.models.SportshubWrappedData;
import com.functions.wrapped.models.requests.GetWrappedRequest;
import com.functions.wrapped.models.responses.GetWrappedResponse;
import com.functions.wrapped.services.WrappedService;

/**
 * Handler for getting Sportshub Wrapped data for an organiser.
 */
public class GetWrappedHandler implements Handler<GetWrappedRequest, GetWrappedResponse> {
    private static final Logger logger = LoggerFactory.getLogger(GetWrappedHandler.class);

    @Override
    public GetWrappedRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), GetWrappedRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse GetWrappedRequest", e);
        }
    }

    @Override
    public GetWrappedResponse handle(GetWrappedRequest request) {
        logger.info("Handling get wrapped request for organiserId: {}, year: {}", 
                request.organiserId(), request.year());

        try {
            SportshubWrappedData wrappedData = WrappedService.getOrGenerateWrappedData(
                    request.organiserId(), 
                    request.year()
            );

            logger.info("Successfully retrieved wrapped data for organiserId: {}, year: {}", 
                    request.organiserId(), request.year());
            
            return new GetWrappedResponse(wrappedData);
        } catch (Exception e) {
            logger.error("Failed to get wrapped data for organiserId: {}, year: {}", 
                    request.organiserId(), request.year(), e);
            throw new RuntimeException("Failed to get wrapped data for organiserId: " + request.organiserId(), e);
        }
    }
}

