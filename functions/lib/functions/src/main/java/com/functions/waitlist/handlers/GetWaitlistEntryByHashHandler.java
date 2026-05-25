package com.functions.waitlist.handlers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;
import com.functions.waitlist.models.WaitlistEntry;
import com.functions.waitlist.models.requests.GetWaitlistEntryByHashRequest;
import com.functions.waitlist.models.responses.GetWaitlistEntryByHashResponse;
import com.functions.waitlist.repositories.WaitlistRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

/**
 * Returns the waitlist entry for a given (eventId, emailHash) pair.
 * Used by the self-service removal page linked from confirmation emails.
 * No authentication is required.
 */
public class GetWaitlistEntryByHashHandler implements
        Handler<GetWaitlistEntryByHashRequest, GetWaitlistEntryByHashResponse> {

    private static final Logger logger = LoggerFactory.getLogger(GetWaitlistEntryByHashHandler.class);

    @Override
    public GetWaitlistEntryByHashRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), GetWaitlistEntryByHashRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse GetWaitlistEntryByHashRequest", e);
        }
    }

    @Override
    public GetWaitlistEntryByHashResponse handle(GetWaitlistEntryByHashRequest request) {
        if (request == null || request.getEventId() == null || request.getEmailHash() == null) {
            throw new IllegalArgumentException("eventId and emailHash are required");
        }

        logger.info("Fetching waitlist entry by hash for eventId: {}", request.getEventId());

        Optional<WaitlistEntry> entry = WaitlistRepository.getWaitlistEntryByHash(
                request.getEventId(), request.getEmailHash());

        if (entry.isEmpty()) {
            return GetWaitlistEntryByHashResponse.builder()
                    .found(false)
                    .build();
        }

        WaitlistEntry e = entry.get();
        return GetWaitlistEntryByHashResponse.builder()
                .found(true)
                .name(e.getName())
                .email(e.getEmail())
                .ticketCount(e.getTicketCount())
                .build();
    }
}
