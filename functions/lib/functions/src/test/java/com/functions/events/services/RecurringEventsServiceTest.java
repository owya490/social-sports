package com.functions.events.services;

import com.functions.events.models.AbstractEventData;
import com.functions.events.models.Attendee;
import com.functions.events.models.NewEventData;
import com.functions.events.models.RecurrenceData;
import com.functions.events.utils.EventTimeZone;
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
                timestamp(start), RecurrenceData.Frequency.WEEKLY, 1, true, sydney);

        ZonedDateTime beforeTransition = inSydney(recurrences.get(0));
        ZonedDateTime afterTransition = inSydney(recurrences.get(1));

        Assert.assertEquals(LocalDateTime.of(2026, 9, 28, 9, 0), beforeTransition.toLocalDateTime());
        Assert.assertEquals(ZoneOffset.ofHours(10), beforeTransition.getOffset());
        Assert.assertEquals(LocalDateTime.of(2026, 10, 5, 9, 0), afterTransition.toLocalDateTime());
        Assert.assertEquals(ZoneOffset.ofHours(11), afterTransition.getOffset());
        Assert.assertEquals(Duration.ofHours(7 * 24 - 1),
                Duration.between(beforeTransition.toInstant(), afterTransition.toInstant()));
    }

    @Test
    public void weeklySeriesKeepsBrisbaneNineAmWithAFixedOffset() {
        ZoneId brisbane = ZoneId.of("Australia/Brisbane");
        ZonedDateTime start = ZonedDateTime.of(2026, 9, 28, 9, 0, 0, 0, brisbane);

        List<Timestamp> recurrences = RecurringEventsService.calculateAllRecurrenceDates(
                timestamp(start), RecurrenceData.Frequency.WEEKLY, 1, true, brisbane);

        ZonedDateTime beforeTransition = inZone(recurrences.get(0), brisbane);
        ZonedDateTime afterTransition = inZone(recurrences.get(1), brisbane);

        Assert.assertEquals(LocalDateTime.of(2026, 9, 28, 9, 0), beforeTransition.toLocalDateTime());
        Assert.assertEquals(ZoneOffset.ofHours(10), beforeTransition.getOffset());
        Assert.assertEquals(LocalDateTime.of(2026, 10, 5, 9, 0), afterTransition.toLocalDateTime());
        Assert.assertEquals(ZoneOffset.ofHours(10), afterTransition.getOffset());
        Assert.assertEquals(Duration.ofHours(7 * 24),
                Duration.between(beforeTransition.toInstant(), afterTransition.toInstant()));
    }

    @Test
    public void weeklySeriesKeepsAdelaideNineAmAcrossItsOwnDaylightSaving() {
        ZoneId adelaide = ZoneId.of("Australia/Adelaide");
        ZonedDateTime start = ZonedDateTime.of(2026, 9, 28, 9, 0, 0, 0, adelaide);

        List<Timestamp> recurrences = RecurringEventsService.calculateAllRecurrenceDates(
                timestamp(start), RecurrenceData.Frequency.WEEKLY, 1, true, adelaide);

        ZonedDateTime beforeTransition = inZone(recurrences.get(0), adelaide);
        ZonedDateTime afterTransition = inZone(recurrences.get(1), adelaide);

        Assert.assertEquals(LocalDateTime.of(2026, 9, 28, 9, 0), beforeTransition.toLocalDateTime());
        Assert.assertEquals(ZoneOffset.ofHoursMinutes(9, 30), beforeTransition.getOffset());
        Assert.assertEquals(LocalDateTime.of(2026, 10, 5, 9, 0), afterTransition.toLocalDateTime());
        Assert.assertEquals(ZoneOffset.ofHoursMinutes(10, 30), afterTransition.getOffset());
        Assert.assertEquals(Duration.ofHours(7 * 24 - 1),
                Duration.between(beforeTransition.toInstant(), afterTransition.toInstant()));
    }

    @Test
    public void fortnightlyAndMonthlyStayOnTheSydneyClock() {
        ZoneId sydney = ZoneId.of("Australia/Sydney");
        ZonedDateTime start = ZonedDateTime.of(2026, 9, 28, 9, 0, 0, 0, sydney);

        ZonedDateTime fortnight = inZone(RecurringEventsService.calculateAllRecurrenceDates(
                timestamp(start), RecurrenceData.Frequency.FORTNIGHTLY, 1, true, sydney).get(1), sydney);
        ZonedDateTime month = inZone(RecurringEventsService.calculateAllRecurrenceDates(
                timestamp(start), RecurrenceData.Frequency.MONTHLY, 1, true, sydney).get(1), sydney);

        Assert.assertEquals(LocalDateTime.of(2026, 10, 12, 9, 0), fortnight.toLocalDateTime());
        Assert.assertEquals(ZoneOffset.ofHours(11), fortnight.getOffset());
        Assert.assertEquals(LocalDateTime.of(2026, 10, 28, 9, 0), month.toLocalDateTime());
        Assert.assertEquals(ZoneOffset.ofHours(11), month.getOffset());
    }

    @Test
    public void registrationDeadlineAndEndStayOnTheVenueClockAcrossSydneyDst() {
        ZoneId sydney = ZoneId.of("Australia/Sydney");
        // Monday 28 Sep 2026 09:00 AEST. DST starts Sunday 4 Oct 2026 02:00.
        ZonedDateTime start = ZonedDateTime.of(2026, 9, 28, 9, 0, 0, 0, sydney);
        ZonedDateTime end = ZonedDateTime.of(2026, 9, 28, 11, 0, 0, 0, sydney);
        // 09:00 three days earlier. The next week's gap contains the spring-forward,
        // so a frozen 72-hour UTC duration would land at 08:00 instead of 09:00.
        ZonedDateTime deadline = ZonedDateTime.of(2026, 9, 25, 9, 0, 0, 0, sydney);
        NewEventData template = eventWithClock(sydney, start, end, deadline);

        List<Timestamp> recurrences = RecurringEventsService.calculateAllRecurrenceDates(
                timestamp(start), RecurrenceData.Frequency.WEEKLY, 1, true, sydney);
        NewEventData next = RecurringEventsCronService.createEventDataForRecurrence(template, recurrences.get(1));

        ZonedDateTime nextStart = inZone(next.getStartDate(), sydney);
        ZonedDateTime nextEnd = inZone(next.getEndDate(), sydney);
        ZonedDateTime nextDeadline = inZone(next.getRegistrationDeadline(), sydney);

        Assert.assertEquals(LocalDateTime.of(2026, 10, 5, 9, 0), nextStart.toLocalDateTime());
        Assert.assertEquals(ZoneOffset.ofHours(11), nextStart.getOffset());
        Assert.assertEquals(LocalDateTime.of(2026, 10, 5, 11, 0), nextEnd.toLocalDateTime());
        Assert.assertEquals(ZoneOffset.ofHours(11), nextEnd.getOffset());
        Assert.assertEquals(Duration.ofHours(2), Duration.between(nextStart.toInstant(), nextEnd.toInstant()));
        Assert.assertEquals(LocalDateTime.of(2026, 10, 2, 9, 0), nextDeadline.toLocalDateTime());
        Assert.assertEquals(ZoneOffset.ofHours(10), nextDeadline.getOffset());
        Assert.assertEquals(Instant.parse("2026-10-01T23:00:00Z"), nextDeadline.toInstant());
        Assert.assertEquals("Australia/Sydney", next.getTimezone());
    }

    @Test
    public void twoHourDeadlineStaysTwoHoursBeforeAfterSydneyDst() {
        ZoneId sydney = ZoneId.of("Australia/Sydney");
        ZonedDateTime start = ZonedDateTime.of(2026, 9, 28, 9, 0, 0, 0, sydney);
        ZonedDateTime end = ZonedDateTime.of(2026, 9, 28, 10, 0, 0, 0, sydney);
        ZonedDateTime deadline = ZonedDateTime.of(2026, 9, 28, 7, 0, 0, 0, sydney);
        NewEventData template = eventWithClock(sydney, start, end, deadline);

        Timestamp occurrenceStart = RecurringEventsService.calculateAllRecurrenceDates(
                timestamp(start), RecurrenceData.Frequency.WEEKLY, 1, true, sydney).get(1);
        NewEventData next = RecurringEventsCronService.createEventDataForRecurrence(template, occurrenceStart);
        ZonedDateTime nextStart = inZone(next.getStartDate(), sydney);
        ZonedDateTime nextDeadline = inZone(next.getRegistrationDeadline(), sydney);

        Assert.assertEquals(LocalDateTime.of(2026, 10, 5, 7, 0), nextDeadline.toLocalDateTime());
        Assert.assertEquals(ZoneOffset.ofHours(11), nextDeadline.getOffset());
        Assert.assertEquals(Duration.ofHours(2), Duration.between(nextDeadline.toInstant(), nextStart.toInstant()));
    }

    @Test
    public void dayBeforeNineAmDeadlineStaysNineAmAfterSydneyDst() {
        ZoneId sydney = ZoneId.of("Australia/Sydney");
        ZonedDateTime start = ZonedDateTime.of(2026, 9, 28, 9, 0, 0, 0, sydney);
        ZonedDateTime end = ZonedDateTime.of(2026, 9, 28, 10, 0, 0, 0, sydney);
        ZonedDateTime deadline = ZonedDateTime.of(2026, 9, 27, 9, 0, 0, 0, sydney);
        NewEventData template = eventWithClock(sydney, start, end, deadline);

        Timestamp occurrenceStart = RecurringEventsService.calculateAllRecurrenceDates(
                timestamp(start), RecurrenceData.Frequency.WEEKLY, 1, true, sydney).get(1);
        NewEventData next = RecurringEventsCronService.createEventDataForRecurrence(template, occurrenceStart);
        ZonedDateTime nextDeadline = inZone(next.getRegistrationDeadline(), sydney);

        Assert.assertEquals(LocalDateTime.of(2026, 10, 4, 9, 0), nextDeadline.toLocalDateTime());
        Assert.assertEquals(ZoneOffset.ofHours(11), nextDeadline.getOffset());
        Assert.assertEquals(Instant.parse("2026-10-03T22:00:00Z"), nextDeadline.toInstant());
    }

    @Test
    public void missingTimezoneFallsBackToSydneyAndCoordinatesPickTheVenue() {
        NewEventData missing = new NewEventData();
        Assert.assertEquals(EventTimeZone.FALLBACK, EventTimeZone.stamp(missing));
        Assert.assertEquals("Australia/Sydney", missing.getTimezone());

        NewEventData placeholder = eventWithCoordinates(0.0, 0.0);
        placeholder.setTimezone("GMT+10");
        Assert.assertEquals(EventTimeZone.FALLBACK, EventTimeZone.stamp(placeholder));

        NewEventData stored = new NewEventData();
        stored.setTimezone("Australia/Adelaide");
        Assert.assertEquals(ZoneId.of("Australia/Adelaide"), EventTimeZone.stamp(stored));

        Assert.assertEquals("Australia/Brisbane", EventTimeZone.stamp(eventWithCoordinates(-27.4698, 153.0251)).getId());
        Assert.assertEquals("Australia/Adelaide", EventTimeZone.stamp(eventWithCoordinates(-34.9285, 138.6007)).getId());
        Assert.assertEquals("Australia/Sydney", EventTimeZone.stamp(eventWithCoordinates(-33.8688, 151.2093)).getId());
        Assert.assertEquals("Australia/Broken_Hill", EventTimeZone.stamp(eventWithCoordinates(-31.9539, 141.4539)).getId());

        NewEventData movedPin = eventWithCoordinates(-27.4698, 153.0251);
        movedPin.setTimezone("Australia/Sydney");
        Assert.assertEquals("Australia/Brisbane", EventTimeZone.stamp(movedPin).getId());
    }

    private static NewEventData eventWithClock(ZoneId zone, ZonedDateTime start, ZonedDateTime end, ZonedDateTime deadline) {
        NewEventData event = new NewEventData();
        event.setTimezone(zone.getId());
        event.setStartDate(timestamp(start));
        event.setEndDate(timestamp(end));
        event.setRegistrationDeadline(timestamp(deadline));
        return event;
    }

    private static NewEventData eventWithCoordinates(double lat, double lng) {
        NewEventData event = new NewEventData();
        AbstractEventData.LocationLatLng latLng = new AbstractEventData.LocationLatLng();
        latLng.setLat(lat);
        latLng.setLng(lng);
        event.setLocationLatLng(latLng);
        return event;
    }

    private static ZonedDateTime inZone(Timestamp timestamp, ZoneId zone) {
        return Instant.ofEpochSecond(timestamp.getSeconds(), timestamp.getNanos()).atZone(zone);
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
