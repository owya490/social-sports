package com.functions.emails.reminder;

import java.util.List;

/**
 * One reminder recipient. Several approved orders for the same email collapse
 * into a single purchaser, keeping each distinct name.
 */
public record ReminderPurchaser(String email, List<String> names) {
    public ReminderPurchaser {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Purchaser email is required");
        }
        names = List.copyOf(names);
    }

    public String displayName() {
        return String.join(" and ", names);
    }
}
