package com.functions.events.handlers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.events.models.RecurrenceTemplate;
import com.functions.events.models.requests.UpdateRecurrenceTemplateV2Request;
import com.functions.events.models.responses.UpdateRecurrenceTemplateV2Response;
import com.functions.events.repositories.RecurrenceTemplateRepository;
import com.functions.events.services.RecurringEventsV2Service;
import com.functions.global.models.AuthContext;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.global.services.EventAuthorizationService;
import com.functions.utils.JavaUtils;

public class UpdateRecurrenceTemplateV2Handler
        implements Handler<UpdateRecurrenceTemplateV2Request, UpdateRecurrenceTemplateV2Response> {
    private static final Logger logger = LoggerFactory.getLogger(UpdateRecurrenceTemplateV2Handler.class);

    @Override
    public UpdateRecurrenceTemplateV2Request parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), UpdateRecurrenceTemplateV2Request.class);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Failed to parse UpdateRecurrenceTemplateV2Request", e);
        }
    }

    @Override
    public UpdateRecurrenceTemplateV2Response handle(
            UpdateRecurrenceTemplateV2Request request,
            AuthContext authContext) throws Exception {
        if (request == null || request.recurrenceTemplateId() == null || request.recurrenceTemplateId().isBlank()) {
            throw new IllegalArgumentException("recurrenceTemplateId is required");
        }

        RecurrenceTemplate current = RecurrenceTemplateRepository.getRecurrenceTemplate(request.recurrenceTemplateId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Recurrence template not found: " + request.recurrenceTemplateId()));
        String organiserId = current.getEventData() == null ? null : current.getEventData().getOrganiserId();
        EventAuthorizationService.requireMatchingUser(
                authContext.requireUid(),
                organiserId,
                "You are not allowed to update this recurring event template");

        if (request.eventData() != null
                && request.eventData().getOrganiserId() != null
                && !request.eventData().getOrganiserId().equals(organiserId)) {
            throw new IllegalArgumentException("organiserId cannot be changed");
        }

        logger.info("Updating v2 recurrence template {}", request.recurrenceTemplateId());
        return RecurringEventsV2Service.updateRecurrenceTemplate(request);
    }
}
