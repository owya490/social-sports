package com.functions.waitlist.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;
import com.functions.waitlist.models.requests.JoinWaitlistRequest;
import com.functions.waitlist.models.responses.JoinWaitlistResponse;
import com.functions.waitlist.services.WaitlistService;

/**
 * Handler for joining an event waitlist.
 */
public class JoinWaitlistEndpointHandler implements Handler<JoinWaitlistRequest, JoinWaitlistResponse> {
    private static final Logger logger = LoggerFactory.getLogger(JoinWaitlistEndpointHandler.class);

    @Override
    public JoinWaitlistRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), JoinWaitlistRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse JoinWaitlistRequest", e);
        }
    }

    @Override
    public JoinWaitlistResponse handle(JoinWaitlistRequest request) {
        logger.info("Handling join waitlist request for event: {}, email: {}", 
                request.getEventId(), request.getEmail());
        
        // Validate email format
        if (!isValidEmail(request.getEmail())) {
            return JoinWaitlistResponse.builder()
                    .success(false)
                    .message("invalid email format")
                    .build();
        }

        // Call service
        return WaitlistService.joinWaitlist(request);
    }

    /**
     * Validates email format using regex pattern
     */
    private boolean isValidEmail(String email) {
        // RFC 5322 compliant regex pattern for email validation
        String emailRegex = "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$";
        return email != null && email.matches(emailRegex);
    }
}

