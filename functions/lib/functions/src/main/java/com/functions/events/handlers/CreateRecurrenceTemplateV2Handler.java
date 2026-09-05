package com.functions.events.handlers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.events.models.requests.CreateRecurrenceTemplateV2Request;
import com.functions.events.models.responses.CreateRecurrenceTemplateV2Response;
import com.functions.events.services.RecurringEventsV2Service;
import com.functions.global.models.AuthContext;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.global.services.EventAuthorizationService;
import com.functions.utils.JavaUtils;

public class CreateRecurrenceTemplateV2Handler
        implements Handler<CreateRecurrenceTemplateV2Request, CreateRecurrenceTemplateV2Response> {
    private static final Logger logger = LoggerFactory.getLogger(CreateRecurrenceTemplateV2Handler.class);

    @Override
    public CreateRecurrenceTemplateV2Request parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), CreateRecurrenceTemplateV2Request.class);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Failed to parse CreateRecurrenceTemplateV2Request", e);
        }
    }

    @Override
    public CreateRecurrenceTemplateV2Response handle(
            CreateRecurrenceTemplateV2Request request,
            AuthContext authContext) throws Exception {
        if (request == null || request.eventData() == null) {
            throw new IllegalArgumentException("eventData is required");
        }
        if (request.eventData().getOrganiserId() == null || request.eventData().getOrganiserId().isBlank()) {
            throw new IllegalArgumentException("organiserId is required");
        }

        EventAuthorizationService.requireMatchingUser(
                authContext.requireUid(),
                request.eventData().getOrganiserId(),
                "You are not allowed to create recurring events for another organiser");

        logger.info("Creating v2 recurrence template for organiser {}", request.eventData().getOrganiserId());
        return RecurringEventsV2Service.createRecurrenceTemplate(request);
    }
}
