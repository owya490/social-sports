package com.functions.events.handlers;

import java.util.Optional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.events.exceptions.RecurrenceTemplateNotFoundException;
import com.functions.events.models.RecurrenceTemplate;
import com.functions.events.models.requests.ArchiveRecurrenceTemplateRequest;
import com.functions.events.models.responses.ArchiveRecurrenceTemplateResponse;
import com.functions.events.repositories.RecurrenceTemplateRepository;
import com.functions.events.services.RecurringEventsService;
import com.functions.global.models.AuthContext;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.global.services.EventAuthorizationService;
import com.functions.utils.JavaUtils;

public class ArchiveRecurrenceTemplateHandler
        implements Handler<ArchiveRecurrenceTemplateRequest, ArchiveRecurrenceTemplateResponse> {

    @Override
    public ArchiveRecurrenceTemplateRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), ArchiveRecurrenceTemplateRequest.class);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Failed to parse recurrence template request", e);
        }
    }

    @Override
    public ArchiveRecurrenceTemplateResponse handle(ArchiveRecurrenceTemplateRequest request, AuthContext authContext)
            throws Exception {
        if (request == null || request.recurrenceTemplateId() == null || request.recurrenceTemplateId().isBlank()) {
            throw new IllegalArgumentException("recurrenceTemplateId is required");
        }

        RecurrenceTemplate existingTemplate = find(request.recurrenceTemplateId())
                .orElseThrow(() -> new RecurrenceTemplateNotFoundException(request.recurrenceTemplateId()));
        EventAuthorizationService.requireMatchingUser(authContext.requireUid(),
                existingTemplate.getEventData().getOrganiserId(),
                "You are not allowed to archive this recurrence template");

        archive(request.recurrenceTemplateId());
        return new ArchiveRecurrenceTemplateResponse(request.recurrenceTemplateId());
    }

    protected Optional<RecurrenceTemplate> find(String recurrenceTemplateId) {
        return RecurrenceTemplateRepository.getRecurrenceTemplate(recurrenceTemplateId);
    }

    protected void archive(String recurrenceTemplateId) throws Exception {
        RecurringEventsService.archiveRecurrenceTemplate(recurrenceTemplateId);
    }
}
