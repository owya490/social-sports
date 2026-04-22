package com.functions.global.models.responses;

import java.util.List;

/**
 * Error body returned when DELETE_RECURRENCE_TEMPLATE fails because the template is still in use.
 */
public record RecurrenceTemplateInUseErrorResponse(
        String errorMessage,
        List<String> blockingEventCollectionIds,
        List<String> blockingCustomEventLinkPaths) {
}
