package com.functions.emails;

/**
 * Enum for Loops.so transactional email template IDs.
 * Each template type maps to a specific transactional ID in Loops.
 */
public enum EmailTemplateType {

    PURCHASE("cm4r78nk301ehx79nrrxaijgl"),
    WAITLIST_CONFIRMATION("cmjcdaf0h05gt0i56iicea2ys"),
    WAITLIST_NOTIFICATION("cmjgp5at54ceh0iyg06ddxftt"),

    /** Sent when a booking request is received and awaiting organiser approval. */
    BOOKING_PENDING("cmnd2gkqh03ja0ixlz9fx93re"),

    /** Sent when an organiser approves a pending booking. */
    BOOKING_APPROVED("cmqm0fa3719jx0j0fu0ksganb"),

    /** Sent when a pending booking is rejected or expires. */
    BOOKING_REJECTED("cml0rm3t21e8s0ixa21rvcfnx"),

    /** Same Loops transactional as {@link #BOOKING_PENDING} — organiser copy at pending checkout. */
    BOOKING_APPROVAL_ORGANISER(BOOKING_PENDING.templateId);

    public final String templateId;

    EmailTemplateType(String templateId) {
        this.templateId = templateId;
    }

}

