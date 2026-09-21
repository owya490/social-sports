package com.functions.events.handlers;

import java.util.Optional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.events.exceptions.RecurrenceTemplateNotFoundException;
import com.functions.events.models.RecurrenceTemplate;
import com.functions.events.models.requests.UpdateRecurrenceTemplateRequest;
import com.functions.events.models.responses.UpdateRecurrenceTemplateResponse;
import com.functions.events.repositories.RecurrenceTemplateRepository;
import com.functions.events.services.RecurringEventsService;
import com.functions.global.models.AuthContext;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.global.services.EventAuthorizationService;
import com.functions.utils.JavaUtils;

public class UpdateRecurrenceTemplateHandler
        implements Handler<UpdateRecurrenceTemplateRequest, UpdateRecurrenceTemplateResponse> {

    @Override
    public UpdateRecurrenceTemplateRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), UpdateRecurrenceTemplateRequest.class);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Failed to parse recurrence template request", e);
        }
    }

    @Override
    public UpdateRecurrenceTemplateResponse handle(UpdateRecurrenceTemplateRequest request, AuthContext authContext) {
        if (request == null || request.recurrenceTemplateId() == null || request.recurrenceTemplateId().isBlank()) {
            throw new IllegalArgumentException("recurrenceTemplateId is required");
        }
        if (request.eventData() == null && request.recurrenceData() == null) {
            throw new IllegalArgumentException("eventData or recurrenceData is required");
        }

        RecurrenceTemplate existingTemplate = find(request.recurrenceTemplateId())
                .orElseThrow(() -> new RecurrenceTemplateNotFoundException(request.recurrenceTemplateId()));
        EventAuthorizationService.requireMatchingUser(authContext.requireUid(),
                existingTemplate.getEventData().getOrganiserId(),
                "You are not allowed to update this recurrence template");

        String recurrenceTemplateId = update(request)
                .orElseThrow(() -> new RuntimeException("Failed to update recurrence template"));
        return new UpdateRecurrenceTemplateResponse(recurrenceTemplateId);
    }

    protected Optional<RecurrenceTemplate> find(String recurrenceTemplateId) {
        return RecurrenceTemplateRepository.getRecurrenceTemplate(recurrenceTemplateId);
    }

    protected Optional<String> update(UpdateRecurrenceTemplateRequest request) {
        return RecurringEventsService.updateRecurrenceTemplate(request.recurrenceTemplateId(), request.eventData(),
                request.recurrenceData());
    }
}
