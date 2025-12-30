package com.functions.waitlist.handlers;

import org.apache.commons.validator.routines.EmailValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.fulfilment.services.WaitlistFulfilmentService;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;
import com.functions.waitlist.models.requests.UpdateFulfilmentEntityWithWaitlistDataRequest;
import com.functions.waitlist.models.responses.UpdateFulfilmentEntityWithWaitlistDataResponse;
import com.functions.waitlist.services.WaitlistService;

/**
 * Handler for joining an event waitlist.
 */
public class UpdateFulfilmentEntityWithWaitlistDataHandler implements Handler<UpdateFulfilmentEntityWithWaitlistDataRequest, UpdateFulfilmentEntityWithWaitlistDataResponse> {
    private static final Logger logger = LoggerFactory.getLogger(UpdateFulfilmentEntityWithWaitlistDataHandler.class);

    @Override
    public UpdateFulfilmentEntityWithWaitlistDataRequest parse(UnifiedRequest data) {
        try {
            // parse the JSON data from the global app controller into a request object 
            // treeToValue is a utility method that converts a JSON tree node into a normal Java object.
            return JavaUtils.objectMapper.treeToValue(data.data(), UpdateFulfilmentEntityWithWaitlistDataRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse JoinWaitlistRequest", e);
        }
    }

    @Override
    public UpdateFulfilmentEntityWithWaitlistDataResponse handle(UpdateFulfilmentEntityWithWaitlistDataRequest request) {
        try {
            
            // check for null request and null values
            if (request == null || request.getEmail() == null || request.getFulfilmentSessionId() == null) {
                throw new IllegalArgumentException("Both email and fulfilmentSessionId are required");
            }
            
            logger.info("Handling update waitlist fulfilment entity with data request for fulfilmentSessionId: {}, email: {}",
            request.getFulfilmentSessionId(), request.getEmail());
            
            // email validation
            if (!isValidEmail(request.getEmail())) {
                logger.error("Invalid email format for email: {}", request.getEmail());
                throw new IllegalArgumentException("Invalid email format");
            }
            
            WaitlistFulfilmentService.updateFulfilmentEntityWithWaitlistData(request.getFulfilmentSessionId(), request.getFulfilmentEntityId(), request.getName(), request.getEmail());
            
            return UpdateFulfilmentEntityWithWaitlistDataResponse.builder()
                .success(true)
                .message("Waitlist entity updated successfully")
                .build();
        } catch (Exception e) {
            logger.error("Failed to update waitlist fulfilment entity with data: {}", e.getMessage());
            return UpdateFulfilmentEntityWithWaitlistDataResponse.builder()
                .success(false)
                .message(e.getMessage())
                .build();
        }
    }

    /**
     * Validates email format using Apache Commons EmailValidator
     */
    private boolean isValidEmail(String email) {
        return email != null && EmailValidator.getInstance().isValid(email);
    }
}

