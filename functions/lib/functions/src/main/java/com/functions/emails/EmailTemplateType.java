package com.functions.emails;

/**
 * Enum for Loops.so transactional email template IDs.
 * Each template type maps to a specific transactional ID in Loops.
 */
public enum EmailTemplateType {

    PURCHASE("cm4r78nk301ehx79nrrxaijgl"),
    WAITLIST_CONFIRMATION("cmjcdaf0h05gt0i56iicea2ys"),
    WAITLIST_NOTIFICATION("cmjgp5at54ceh0iyg06ddxftt"),

    BOOKING_APPROVAL_TENTATIVE("cmnd2gkqh03ja0ixlz9fx93re"),

    /** Same Loops transactional as {@link #PURCHASE} — sent when an organiser approves a pending booking. */
    BOOKING_APPROVED(PURCHASE.templateId),

    /** Same Loops transactional as {@link #BOOKING_APPROVAL_TENTATIVE} — organiser copy at pending checkout. */
    BOOKING_APPROVAL_ORGANISER(BOOKING_APPROVAL_TENTATIVE.templateId);

    public final String templateId;

    EmailTemplateType(String templateId) {
        this.templateId = templateId;
    }

}

