package com.functions.events.handlers;

import java.util.Map;
import java.util.Optional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.events.models.requests.CreateRecurrenceTemplateRequest;
import com.functions.events.models.responses.CreateRecurrenceTemplateResponse;
import com.functions.events.services.RecurringEventsService;
import com.functions.global.models.AuthContext;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.global.services.EventAuthorizationService;
import com.functions.utils.JavaUtils;

public class CreateRecurrenceTemplateHandler
        implements Handler<CreateRecurrenceTemplateRequest, CreateRecurrenceTemplateResponse> {

    @Override
    public CreateRecurrenceTemplateRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), CreateRecurrenceTemplateRequest.class);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Failed to parse recurrence template request", e);
        }
    }

    @Override
    public CreateRecurrenceTemplateResponse handle(CreateRecurrenceTemplateRequest request, AuthContext authContext) {
        if (request == null || request.eventData() == null) {
            throw new IllegalArgumentException("eventData is required");
        }
        if (request.recurrenceData() == null) {
            throw new IllegalArgumentException("recurrenceData is required");
        }
        if (request.eventData().getOrganiserId() == null || request.eventData().getOrganiserId().isBlank()) {
            throw new IllegalArgumentException("organiserId is required");
        }

        EventAuthorizationService.requireMatchingUser(authContext.requireUid(), request.eventData().getOrganiserId(),
                "You are not allowed to create recurrence templates for another organiser");

        Map.Entry<String, String> result = create(request)
                .orElseThrow(() -> new RuntimeException("Failed to create recurrence template"));
        return new CreateRecurrenceTemplateResponse(result.getKey(), result.getValue());
    }

    protected Optional<Map.Entry<String, String>> create(CreateRecurrenceTemplateRequest request) {
        return RecurringEventsService.createRecurrenceTemplate(request.eventData(), request.recurrenceData());
    }
}
