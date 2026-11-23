package com.functions.emails.reminder;

import java.time.LocalDate;

public interface EmailReminderJob {
    EmailReminderResult sendFor(LocalDate eventDate);
}
