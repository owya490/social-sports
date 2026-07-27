package com.functions.wrapped.handlers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.global.exceptions.AuthenticationException;
import com.functions.global.models.AuthContext;
import com.functions.global.models.AuthLevel;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.global.services.EventAuthorizationService;
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
    public GetWrappedResponse handle(GetWrappedRequest request, AuthContext authContext) {
        logger.info("Handling get wrapped request for organiserId: {}, year: {}, wrappedId: {}", 
                request.organiserId(), request.year(), request.wrappedId());

        // This handler serves two endpoints. GET_SPORTSHUB_WRAPPED is AUTHENTICATED and
        // may only read the caller's own data. GET_SPORTSHUB_WRAPPED_BY_SHARE_ID is
        // PUBLIC and requires a wrappedId, which WrappedService verifies against the
        // stored record — the share id is the capability.
        if (authContext.level() == AuthLevel.AUTHENTICATED) {
            EventAuthorizationService.requireMatchingUser(
                    authContext.requireUid(),
                    request.organiserId(),
                    "You are not allowed to access another organiser's wrapped data");
        } else if (request.wrappedId() == null || request.wrappedId().isBlank()) {
            throw new AuthenticationException("wrappedId is required to access wrapped data via a share link");
        }

        try {
            SportshubWrappedData wrappedData = WrappedService.getOrGenerateWrappedData(
                    request.organiserId(), 
                    request.year(),
                    request.wrappedId()
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

