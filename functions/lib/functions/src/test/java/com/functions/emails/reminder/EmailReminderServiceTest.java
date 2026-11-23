package com.functions.emails.reminder;

import static org.junit.Assert.assertEquals;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.Test;

import com.functions.emails.reminder.EmailReminderService.ActiveEventSource;
import com.functions.emails.reminder.EmailReminderService.ReminderClaims;
import com.functions.emails.reminder.EmailReminderService.ReminderMailer;
import com.functions.events.models.EventData;
import com.google.cloud.Timestamp;

public class EmailReminderServiceTest {
    private static final LocalDate SYDNEY_DATE = LocalDate.of(2026, 11, 24);

    @Test
    public void sendsTomorrowsPublicAndPrivateEvents() {
        RecordingMailer mailer = new RecordingMailer();
        EmailReminderService service = service(mailer, new MemoryClaims());

        EmailReminderResult result = service.sendFor(SYDNEY_DATE);

        assertEquals(List.of("due", "private-due"), result.eventIds());
        assertEquals(2, result.sent());
        assertEquals(0, result.failed());
        assertEquals(List.of(
                variables("Ada and Bea", "due", "11/24/2026, 01:00", "11/24/2026, 03:00"),
                variables("Dee", "private-due", "11/24/2026, 02:00", "11/24/2026, 04:00")),
                mailer.sent);

        EmailReminderResult repeat = service.sendFor(SYDNEY_DATE);
        assertEquals(0, repeat.sent());
        assertEquals(2, mailer.sent.size());
    }

    @Test
    public void continuesAfterAFailedSend() {
        RecordingMailer mailer = new RecordingMailer();
        mailer.fail = "ada@example.com";
        mailer.boom = "bea@example.com";
        EmailReminderService service = new EmailReminderService(
                new FixedEvents(List.of(event("due", "2026-11-23T14:00:00Z", "2026-11-23T16:00:00Z")), List.of()),
                eventId -> List.of(
                        new ReminderPurchaser("ada@example.com", List.of("Ada")),
                        new ReminderPurchaser("bea@example.com", List.of("Bea")),
                        new ReminderPurchaser("cara@example.com", List.of("Cara"))),
                mailer,
                new MemoryClaims());

        EmailReminderResult result = service.sendFor(SYDNEY_DATE);

        assertEquals(1, result.sent());
        assertEquals(2, result.failed());
        assertEquals(List.of("ada@example.com", "bea@example.com", "cara@example.com"), mailer.attempted);

        mailer.fail = null;
        mailer.boom = null;
        EmailReminderResult retry = service.sendFor(SYDNEY_DATE);
        assertEquals(2, retry.sent());
        assertEquals(0, retry.failed());
        assertEquals(List.of("ada@example.com", "bea@example.com"), mailer.attempted.subList(3, mailer.attempted.size()));
    }

    private static EmailReminderService service(RecordingMailer mailer, ReminderClaims claims) {
        return new EmailReminderService(
                new FixedEvents(List.of(
                        event("due", "2026-11-23T14:00:00Z", "2026-11-23T16:00:00Z"),
                        event("later", "2026-11-24T14:00:00Z", "2026-11-24T16:00:00Z"),
                        event("previous", "2026-11-23T12:30:00Z", "2026-11-23T16:00:00Z"),
                        event("missing-start", null, "2026-11-23T16:00:00Z"),
                        event("missing-end", "2026-11-23T14:00:00Z", null)),
                        List.of(event("private-due", "2026-11-23T15:00:00Z", "2026-11-23T17:00:00Z"))),
                eventId -> switch (eventId) {
                    case "due" -> List.of(new ReminderPurchaser("ada@example.com", List.of("Ada", "Bea")));
                    case "private-due" -> List.of(new ReminderPurchaser("dee@example.com", List.of("Dee")));
                    default -> List.of();
                },
                mailer,
                claims);
    }

    private static Map<String, String> variables(String name, String eventId, String start, String end) {
        return Map.of(
                "name", name,
                "eventName", "Social hit",
                "eventId", eventId,
                "startDate", start,
                "endDate", end,
                "location", "Oval");
    }

    private static EventData event(String eventId, String start, String end) {
        EventData event = new EventData();
        event.setEventId(eventId);
        event.setName("Social hit");
        event.setLocation("Oval");
        event.setStartDate(timestamp(start));
        event.setEndDate(timestamp(end));
        return event;
    }

    private static Timestamp timestamp(String instant) {
        if (instant == null) {
            return null;
        }
        Instant value = Instant.parse(instant);
        return Timestamp.ofTimeSecondsAndNanos(value.getEpochSecond(), value.getNano());
    }

    private record FixedEvents(List<EventData> publicEvents, List<EventData> privateEvents) implements ActiveEventSource {
        @Override
        public List<EventData> listPublic() {
            return publicEvents;
        }

        @Override
        public List<EventData> listPrivate() {
            return privateEvents;
        }
    }

    private static final class MemoryClaims implements ReminderClaims {
        private final Set<String> held = new HashSet<>();

        @Override
        public boolean claim(String eventId, LocalDate eventDate, String email) {
            return held.add(eventId + eventDate + email);
        }

        @Override
        public void release(String eventId, LocalDate eventDate, String email) {
            held.remove(eventId + eventDate + email);
        }
    }

    private static final class RecordingMailer implements ReminderMailer {
        private final List<Map<String, String>> sent = new ArrayList<>();
        private final List<String> attempted = new ArrayList<>();
        private String fail;
        private String boom;

        @Override
        public boolean send(EventReminderDraft event, ReminderPurchaser purchaser) {
            attempted.add(purchaser.email());
            if (purchaser.email().equals(boom)) {
                throw new IllegalStateException("loops down");
            }
            sent.add(event.variablesFor(purchaser));
            return !purchaser.email().equals(fail);
        }
    }
}
