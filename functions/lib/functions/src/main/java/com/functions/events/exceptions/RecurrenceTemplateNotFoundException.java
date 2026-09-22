package com.functions.events.exceptions;

import com.functions.global.exceptions.NotFoundException;

public class RecurrenceTemplateNotFoundException extends NotFoundException {
    public RecurrenceTemplateNotFoundException(String recurrenceTemplateId) {
        super("Recurrence template not found: " + recurrenceTemplateId);
    }
}
