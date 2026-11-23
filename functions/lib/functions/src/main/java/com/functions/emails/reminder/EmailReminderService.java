package com.functions.emails.reminder;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventData;

/**
 * Sends one reminder per approved purchaser for active events starting on a date.
 */
public final class EmailReminderService implements EmailReminderJob {
    private static final Logger logger = LoggerFactory.getLogger(EmailReminderService.class);

    private final ActiveEventSource events;
    private final PurchaserSource purchasers;
    private final ReminderMailer mailer;
    private final EventStartDay startDay = new EventStartDay();

    public EmailReminderService(ActiveEventSource events, PurchaserSource purchasers, ReminderMailer mailer) {
        this.events = events;
        this.purchasers = purchasers;
        this.mailer = mailer;
    }

    public static EmailReminderService production() {
        return new EmailReminderService(
                new FirestoreActiveEvents(),
                new FirestoreApprovedPurchasers(new ApprovedPurchaserCollector()),
                new LoopsReminderSender());
    }

    @Override
    public EmailReminderResult sendFor(LocalDate eventDate) {
        logger.info("Sending reminder emails for events for date {}", eventDate);

        List<EventData> activeEvents = new ArrayList<>();
        activeEvents.addAll(events.listPublic());
        activeEvents.addAll(events.listPrivate());

        List<EventReminderDraft> due = new ArrayList<>();
        for (EventData event : activeEvents) {
            startDay.matching(event, eventDate).ifPresent(due::add);
        }
        List<String> eventIds = due.stream().map(EventReminderDraft::eventId).toList();
        logger.info("Events starting on {}: {}", eventDate, eventIds);

        int sent = 0;
        int failed = 0;
        for (EventReminderDraft event : due) {
            for (ReminderPurchaser purchaser : purchasers.forEvent(event.eventId())) {
                try {
                    if (mailer.send(event, purchaser)) {
                        sent++;
                    } else {
                        failed++;
                    }
                } catch (RuntimeException e) {
                    failed++;
                    logger.error("Failed to send event reminder. eventId={}", event.eventId(), e);
                }
            }
        }
        return new EmailReminderResult(eventDate, eventIds, sent, failed);
    }

    public interface ActiveEventSource {
        List<EventData> listPublic();

        List<EventData> listPrivate();
    }

    public interface PurchaserSource {
        List<ReminderPurchaser> forEvent(String eventId);
    }

    public interface ReminderMailer {
        boolean send(EventReminderDraft event, ReminderPurchaser purchaser);
    }
}
