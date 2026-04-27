package com.functions.stripe.handlers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.auth.exceptions.UnauthenticatedException;
import com.functions.auth.exceptions.UnauthorizedException;
import com.functions.auth.models.RequestContext;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.stripe.config.StripeConfig;
import com.functions.stripe.models.requests.CreateStripeStandardAccountRequest;
import com.functions.stripe.models.responses.CreateStripeStandardAccountResponse;
import com.functions.stripe.services.StripeAccountService;
import com.functions.utils.JavaUtils;

public class CreateStripeStandardAccountHandler
        implements Handler<CreateStripeStandardAccountRequest, CreateStripeStandardAccountResponse> {
    private static final Logger logger = LoggerFactory.getLogger(CreateStripeStandardAccountHandler.class);

    @Override
    public CreateStripeStandardAccountRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), CreateStripeStandardAccountRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse CreateStripeStandardAccountRequest", e);
        }
    }

    @Override
    public CreateStripeStandardAccountResponse handle(
            CreateStripeStandardAccountRequest parsedRequestData,
            RequestContext requestContext) throws Exception {
        if (requestContext == null || !requestContext.isAuthenticated()) {
            throw new UnauthenticatedException("Authentication is required.");
        }

        String authenticatedUid = requestContext.getAuthenticatedUid();
        if (!parsedRequestData.organiser().equals(authenticatedUid)) {
            logger.error("Authenticated uid does not match organiser. uid={} organiser={}",
                    authenticatedUid, parsedRequestData.organiser());
            throw new UnauthorizedException("Authenticated user does not match organiser.");
        }

        String url = StripeAccountService.getStripeStandardAccountUrl(
                parsedRequestData.organiser(),
                parsedRequestData.returnUrl(),
                parsedRequestData.refreshUrl());

        if (url == null || url.isBlank()) {
            return new CreateStripeStandardAccountResponse(StripeConfig.ERROR_URL);
        }

        return new CreateStripeStandardAccountResponse(url);
    }
}
