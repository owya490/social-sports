package com.functions.events.services;

import com.functions.events.models.Attendee;
import com.functions.events.models.NewEventData;
import com.functions.events.models.RecurrenceData;
import com.functions.utils.JavaUtils;
import com.google.cloud.Timestamp;
import org.junit.Assert;
import org.junit.Test;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.Date;

public class RecurringEventsServiceTest {
    @Test
    public void testCalculateAllRecurrenceDates() {
        Timestamp startTime = Timestamp.of(Date.from(Instant.now()));
        RecurrenceData.Frequency frequency = RecurrenceData.Frequency.WEEKLY;
        int recurrenceAmount = 3;

//        System.out.println(RecurringEventsService.calculateAllRecurrenceDates(startTime, frequency, recurrenceAmount));
    }

    @Test
    public void testDeepCopy() {
        NewEventData eventData = new NewEventData();
        eventData.setLocation("owen");
        eventData.setStartDate(Timestamp.of(Date.from(Instant.now())));

        System.out.println(eventData);
        NewEventData event = JavaUtils.deepCopy(eventData, NewEventData.class);
        System.out.println(event);

        Attendee a = new Attendee();
        a.setPhone("1");
        a.setTicketCount(1);
        System.out.println(a);

        System.out.println(eventData.getStartDate());
    }

    @Test
    public void weeklySeriesKeepsSydneyNineAmAcrossDaylightSaving() {
        ZoneId sydney = ZoneId.of("Australia/Sydney");
        // Monday 28 Sep 2026 09:00 AEST (UTC+10). DST starts Sunday 4 Oct 2026,
        // so the next weekly occurrence is Monday 5 Oct 2026 in AEDT (UTC+11).
        ZonedDateTime start = ZonedDateTime.of(2026, 9, 28, 9, 0, 0, 0, sydney);

        List<Timestamp> recurrences = RecurringEventsService.calculateAllRecurrenceDates(
                timestamp(start), RecurrenceData.Frequency.WEEKLY, 1, true);

        ZonedDateTime beforeTransition = inSydney(recurrences.get(0));
        ZonedDateTime afterTransition = inSydney(recurrences.get(1));

        Assert.assertEquals(LocalDateTime.of(2026, 9, 28, 9, 0), beforeTransition.toLocalDateTime());
        Assert.assertEquals(ZoneOffset.ofHours(10), beforeTransition.getOffset());
        Assert.assertEquals(LocalDateTime.of(2026, 10, 5, 9, 0), afterTransition.toLocalDateTime());
        Assert.assertEquals(ZoneOffset.ofHours(11), afterTransition.getOffset());
        Assert.assertEquals(Duration.ofHours(7 * 24 - 1),
                Duration.between(beforeTransition.toInstant(), afterTransition.toInstant()));
    }

    private static Timestamp timestamp(ZonedDateTime zonedDateTime) {
        return Timestamp.ofTimeSecondsAndNanos(zonedDateTime.toEpochSecond(), zonedDateTime.getNano());
    }

    private static ZonedDateTime inSydney(Timestamp timestamp) {
        return Instant.ofEpochSecond(timestamp.getSeconds(), timestamp.getNanos())
                .atZone(ZoneId.of("Australia/Sydney"));
    }

    @Test
    public void createsOneDueRecurrenceAtATime() {
        Timestamp firstRecurrence = Timestamp.of(Date.from(Instant.parse("2026-08-23T09:00:00Z")));
        Timestamp secondRecurrence = Timestamp.of(Date.from(Instant.parse("2026-08-23T10:00:00Z")));
        RecurrenceData recurrenceData = RecurrenceData.builder()
                .recurrenceEnabled(true)
                .createDaysBefore(0)
                .allRecurrences(List.of(firstRecurrence, secondRecurrence))
                .pastRecurrences(Map.of())
                .build();

        Timestamp selectedRecurrence = RecurringEventsCronService.findNextRecurrenceToCreate(
                recurrenceData, Map.of(), LocalDate.of(2026, 8, 23), false);

        org.junit.Assert.assertEquals(firstRecurrence, selectedRecurrence);
    }

    @Test
    public void usesSydneyDateWhenSelectingDueRecurrence() {
        Timestamp recurrence = Timestamp.of(Date.from(Instant.parse("2026-08-22T14:00:00Z")));
        RecurrenceData recurrenceData = RecurrenceData.builder()
                .recurrenceEnabled(true)
                .createDaysBefore(0)
                .allRecurrences(List.of(recurrence))
                .pastRecurrences(Map.of())
                .build();

        Timestamp selectedRecurrence = RecurringEventsCronService.findNextRecurrenceToCreate(
                recurrenceData, Map.of(), LocalDate.of(2026, 8, 23), false);

        org.junit.Assert.assertEquals(recurrence, selectedRecurrence);
    }

    @Test
    public void movesPastFinalRecurrenceTemplateInactiveWhenNoEventIsCreated() {
        Timestamp recurrence = Timestamp.of(Date.from(Instant.parse("2026-08-23T09:00:00Z")));
        RecurrenceData recurrenceData = RecurrenceData.builder()
                .createDaysBefore(0)
                .allRecurrences(List.of(recurrence))
                .build();

        org.junit.Assert.assertTrue(
                RecurringEventsCronService.shouldMoveTemplateToInactiveAfterNoCreation(
                        recurrenceData, LocalDate.of(2026, 8, 24), false));
    }

    @Test
    public void keepsFutureDisabledTemplateActiveDuringManualCreation() {
        Timestamp recurrence = Timestamp.of(Date.from(Instant.parse("2026-08-23T09:00:00Z")));
        RecurrenceData recurrenceData = RecurrenceData.builder()
                .recurrenceEnabled(false)
                .createDaysBefore(0)
                .allRecurrences(List.of(recurrence))
                .build();

        org.junit.Assert.assertFalse(
                RecurringEventsCronService.shouldMoveTemplateToInactiveAfterNoCreation(
                        recurrenceData, LocalDate.of(2026, 8, 22), true));
    }

}
