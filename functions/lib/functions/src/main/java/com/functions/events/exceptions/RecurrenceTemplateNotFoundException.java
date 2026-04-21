package com.functions.events.exceptions;

/**
 * Thrown when no recurrence template exists for the given id.
 */
public class RecurrenceTemplateNotFoundException extends Exception {
    public RecurrenceTemplateNotFoundException(String recurrenceTemplateId) {
        super("Recurrence template not found: " + recurrenceTemplateId);
    }
}
