package com.functions.emails.reminder;

import java.time.LocalDate;
import java.util.List;

public record EmailReminderResult(LocalDate eventDate, List<String> eventIds, int sent, int failed) {
}
