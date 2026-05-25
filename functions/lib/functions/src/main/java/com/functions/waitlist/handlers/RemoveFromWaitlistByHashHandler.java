package com.functions.waitlist.handlers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;
import com.functions.waitlist.models.requests.RemoveFromWaitlistByHashRequest;
import com.functions.waitlist.models.responses.RemoveFromWaitlistByHashResponse;
import com.functions.waitlist.services.WaitlistService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Removes a waitlist entry identified by (eventId, emailHash).
 * Used by the self-service removal page linked from confirmation/notification emails.
 * No authentication is required.
 */
public class RemoveFromWaitlistByHashHandler implements
        Handler<RemoveFromWaitlistByHashRequest, RemoveFromWaitlistByHashResponse> {

    private static final Logger logger = LoggerFactory.getLogger(RemoveFromWaitlistByHashHandler.class);

    @Override
    public RemoveFromWaitlistByHashRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), RemoveFromWaitlistByHashRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse RemoveFromWaitlistByHashRequest", e);
        }
    }

    @Override
    public RemoveFromWaitlistByHashResponse handle(RemoveFromWaitlistByHashRequest request) {
        if (request == null || request.getEventId() == null || request.getEmailHash() == null) {
            throw new IllegalArgumentException("eventId and emailHash are required");
        }

        logger.info("Removing waitlist entry by hash for eventId: {}", request.getEventId());

        boolean success = WaitlistService.removeFromWaitlistByHash(
                request.getEventId(), request.getEmailHash());

        if (success) {
            return RemoveFromWaitlistByHashResponse.builder()
                    .success(true)
                    .message("Successfully removed from waitlist")
                    .build();
        } else {
            return RemoveFromWaitlistByHashResponse.builder()
                    .success(false)
                    .message("Failed to remove from waitlist")
                    .build();
        }
    }
}
