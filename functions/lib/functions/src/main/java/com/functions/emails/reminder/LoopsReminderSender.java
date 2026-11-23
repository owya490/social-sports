package com.functions.emails.reminder;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.emails.EmailClient;
import com.functions.emails.EmailTemplateType;
import com.functions.emails.reminder.EmailReminderService.ReminderMailer;

/**
 * Sends the reminder through the shared Loops client.
 * Loops allows 10 requests a second, so each send waits briefly before the next.
 */
final class LoopsReminderSender implements ReminderMailer {
    private static final Logger logger = LoggerFactory.getLogger(LoopsReminderSender.class);
    private static final long PAUSE_MILLIS = 300;

    @Override
    public boolean send(EventReminderDraft event, ReminderPurchaser purchaser) {
        boolean sent = EmailClient.sendEmailWithLoopsWithRetries(
                EmailTemplateType.EVENT_REMINDER,
                purchaser.email(),
                event.variablesFor(purchaser));
        pause();
        return sent;
    }

    private static void pause() {
        try {
            Thread.sleep(PAUSE_MILLIS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            logger.warn("Interrupted while pacing reminder emails");
        }
    }
}
