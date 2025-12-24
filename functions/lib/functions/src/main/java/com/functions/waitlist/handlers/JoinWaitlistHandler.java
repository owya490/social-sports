package com.functions.waitlist.handlers;

import org.apache.commons.validator.routines.EmailValidator;
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
public class JoinWaitlistHandler implements Handler<JoinWaitlistRequest, JoinWaitlistResponse> {
    private static final Logger logger = LoggerFactory.getLogger(JoinWaitlistHandler.class);

    @Override
    public JoinWaitlistRequest parse(UnifiedRequest data) {
        try {
            // parse the JSON data from the global app controller into a request object 
            // treeToValue is a utility method that converts a JSON tree node into a normal Java object.
            return JavaUtils.objectMapper.treeToValue(data.data(), JoinWaitlistRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse JoinWaitlistRequest", e);
        }
    }

    @Override
    public JoinWaitlistResponse handle(JoinWaitlistRequest request) {

        // check for null request and null values
        if (request == null || request.getEmail() == null || request.getEventId() == null) {
            throw new IllegalArgumentException("Both email and eventId are required");
        }

        logger.info("Handling join waitlist request for eventId: {}, email: {}",
                request.getEventId(), request.getEmail());

        // email validation
        if (!isValidEmail(request.getEmail())) {
            logger.error("Invalid email format for email: {}", request.getEmail());
            throw new IllegalArgumentException("Invalid email format");
        }

        return WaitlistService.joinWaitlist(request);
    }

    /**
     * Validates email format using Apache Commons EmailValidator
     */
    private boolean isValidEmail(String email) {
        return email != null && EmailValidator.getInstance().isValid(email);
    }
}

