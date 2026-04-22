package com.functions.events.models.responses;

/**
 * Result of successfully deleting a recurrence template.
 */
public record DeleteRecurrenceTemplateResponse(String recurrenceTemplateId, String deletedAt) {
}
