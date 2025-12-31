package com.functions.emails;

/**
 * Enum for Loops.so transactional email template IDs.
 * Each template type maps to a specific transactional ID in Loops.
 */
public enum EmailTemplateType {

    PURCHASE("cm4r78nk301ehx79nrrxaijgl"),
    WAITLIST_CONFIRMATION("cmjcdaf0h05gt0i56iicea2ys"),
    WAITLIST_NOTIFICATION("cmjgp5at54ceh0iyg06ddxftt");

    public final String templateId;

    EmailTemplateType(String templateId) {
        this.templateId = templateId;
    }

}

