package com.functions.events.models.requests;

/**
 * Request to delete (archive) a recurrence template: move to DeletedRecurringEvents and unlink from organiser.
 */
public record DeleteRecurrenceTemplateRequest(String recurrenceTemplateId, String organiserId) {
}
