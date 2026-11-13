package com.functions.events.handlers;

import java.util.Optional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.events.exceptions.RecurrenceTemplateNotFoundException;
import com.functions.events.models.RecurrenceTemplate;
import com.functions.events.models.requests.DeleteRecurrenceTemplateRequest;
import com.functions.events.models.responses.DeleteRecurrenceTemplateResponse;
import com.functions.events.repositories.RecurrenceTemplateRepository;
import com.functions.events.services.RecurringEventsService;
import com.functions.global.models.AuthContext;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.global.services.EventAuthorizationService;
import com.functions.utils.JavaUtils;

public class DeleteRecurrenceTemplateHandler
        implements Handler<DeleteRecurrenceTemplateRequest, DeleteRecurrenceTemplateResponse> {

    @Override
    public DeleteRecurrenceTemplateRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), DeleteRecurrenceTemplateRequest.class);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Failed to parse recurrence template request", e);
        }
    }

    @Override
    public DeleteRecurrenceTemplateResponse handle(DeleteRecurrenceTemplateRequest request, AuthContext authContext)
            throws Exception {
        if (request == null || request.recurrenceTemplateId() == null || request.recurrenceTemplateId().isBlank()) {
            throw new IllegalArgumentException("recurrenceTemplateId is required");
        }

        RecurrenceTemplate existingTemplate = find(request.recurrenceTemplateId())
                .orElseThrow(() -> new RecurrenceTemplateNotFoundException(request.recurrenceTemplateId()));
        EventAuthorizationService.requireMatchingUser(authContext.requireUid(),
                existingTemplate.getEventData().getOrganiserId(),
                "You are not allowed to delete this recurrence template");

        delete(request.recurrenceTemplateId(), existingTemplate.getEventData().getOrganiserId());
        return new DeleteRecurrenceTemplateResponse(request.recurrenceTemplateId());
    }

    protected Optional<RecurrenceTemplate> find(String recurrenceTemplateId) {
        return RecurrenceTemplateRepository.getRecurrenceTemplate(recurrenceTemplateId);
    }

    protected void delete(String recurrenceTemplateId, String organiserId) throws Exception {
        RecurringEventsService.deleteRecurrenceTemplate(recurrenceTemplateId, organiserId);
    }
}
