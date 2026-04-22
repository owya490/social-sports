package com.functions.events.handlers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.events.models.requests.DeleteRecurrenceTemplateRequest;
import com.functions.events.models.responses.DeleteRecurrenceTemplateResponse;
import com.functions.events.services.RecurringEventsService;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;

public class DeleteRecurrenceTemplateHandler implements Handler<DeleteRecurrenceTemplateRequest, DeleteRecurrenceTemplateResponse> {
    private static final Logger logger = LoggerFactory.getLogger(DeleteRecurrenceTemplateHandler.class);

    @Override
    public DeleteRecurrenceTemplateRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), DeleteRecurrenceTemplateRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse DeleteRecurrenceTemplateRequest", e);
        }
    }

    @Override
    public DeleteRecurrenceTemplateResponse handle(DeleteRecurrenceTemplateRequest request) throws Exception {
        if (request == null || request.recurrenceTemplateId() == null || request.recurrenceTemplateId().isBlank()) {
            throw new IllegalArgumentException("recurrenceTemplateId is required");
        }
        if (request.organiserId() == null || request.organiserId().isBlank()) {
            throw new IllegalArgumentException("organiserId is required");
        }
        logger.info("Deleting recurrence template {} for organiser {}", request.recurrenceTemplateId(), request.organiserId());
        return RecurringEventsService.deleteRecurrenceTemplate(request.organiserId(), request.recurrenceTemplateId());
    }
}
