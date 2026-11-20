package com.functions.stripe.handlers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.global.models.AuthContext;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.stripe.models.requests.StartStripePayoutOnboardingRequest;
import com.functions.stripe.models.responses.StartStripePayoutOnboardingResponse;
import com.functions.stripe.services.StripePayoutOnboardingService;
import com.functions.utils.JavaUtils;

public class StartStripePayoutOnboardingHandler
        implements Handler<StartStripePayoutOnboardingRequest, StartStripePayoutOnboardingResponse> {
    private static final Logger logger = LoggerFactory.getLogger(StartStripePayoutOnboardingHandler.class);

    @Override
    public StartStripePayoutOnboardingRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), StartStripePayoutOnboardingRequest.class);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Failed to parse payout details");
        }
    }

    @Override
    public StartStripePayoutOnboardingResponse handle(StartStripePayoutOnboardingRequest request, AuthContext authContext)
            throws Exception {
        String userId = authContext.requireUid();
        logger.info("Starting Stripe payout onboarding for user {}", userId);
        String url = StripePayoutOnboardingService.start(userId, request);
        return new StartStripePayoutOnboardingResponse(url);
    }
}
