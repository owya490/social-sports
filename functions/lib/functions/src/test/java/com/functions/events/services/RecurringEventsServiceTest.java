package com.functions.events.services;

import com.functions.events.models.AbstractEventData;
import com.functions.events.models.Attendee;
import com.functions.events.models.NewEventData;
import com.functions.events.models.RecurrenceData;
import com.functions.events.utils.EventTimeZone;
import com.functions.utils.JavaUtils;
import com.functions.utils.TimeUtils;
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
import java.util.ArrayList;
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
        Assert.assertEquals("Australia/Perth", EventTimeZone.stamp(eventWithCoordinates(-31.9505, 115.8605)).getId());
        Assert.assertEquals("Australia/Melbourne", EventTimeZone.stamp(eventWithCoordinates(-37.8136, 144.9631)).getId());
        Assert.assertEquals("Australia/Hobart", EventTimeZone.stamp(eventWithCoordinates(-42.8821, 147.3272)).getId());
        Assert.assertEquals("Australia/Darwin", EventTimeZone.stamp(eventWithCoordinates(-12.4634, 130.8456)).getId());

        NewEventData movedPin = eventWithCoordinates(-27.4698, 153.0251);
        movedPin.setTimezone("Australia/Sydney");
        Assert.assertEquals("Australia/Brisbane", EventTimeZone.stamp(movedPin).getId());
    }

    private static List<Timestamp> legacyUtcSchedule(Timestamp start, RecurrenceData.Frequency frequency, int recurrenceAmount) {
        List<Timestamp> dates = new ArrayList<>();
        LocalDateTime anchor = TimeUtils.convertTimestampToLocalDateTime(start);
        for (int recurrenceNumber = 0; recurrenceNumber <= recurrenceAmount; recurrenceNumber++) {
            LocalDateTime stepped = frequency == RecurrenceData.Frequency.MONTHLY
                    ? anchor.plusMonths(recurrenceNumber)
                    : anchor.plusDays((long) recurrenceNumber * frequency.getValue());
            dates.add(TimeUtils.convertLocalDateTimeToTimestamp(stepped));
        }
        return dates;
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
        event.setLocationLatLng(coordinates(lat, lng));
        return event;
    }

    private static AbstractEventData.LocationLatLng coordinates(double lat, double lng) {
        AbstractEventData.LocationLatLng latLng = new AbstractEventData.LocationLatLng();
        latLng.setLat(lat);
        latLng.setLng(lng);
        return latLng;
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
    public void brisbaneSummerNineAmEmailsAsNineNotSydneyTen() {
        ZoneId brisbane = ZoneId.of("Australia/Brisbane");
        Timestamp start = timestamp(ZonedDateTime.of(2026, 10, 5, 9, 0, 0, 0, brisbane));

        Assert.assertEquals("10/05/2026, 09:00", TimeUtils.formatTimestampForEmail(start, brisbane));
        Assert.assertEquals("10/05/2026, 10:00", TimeUtils.formatTimestampForEmail(start));
        Assert.assertTrue(TimeUtils.getTimestampStringFromTimezone(start, brisbane).startsWith("2026-10-05 09:00:00"));
    }

    @Test
    public void notYetCreatedPostDstOccurrenceStaysNineAmInTheVenueZone() {
        ZoneId sydney = ZoneId.of("Australia/Sydney");
        ZonedDateTime start = ZonedDateTime.of(2026, 9, 28, 9, 0, 0, 0, sydney);
        NewEventData event = eventWithClock(sydney, start, start.plusHours(1), start.minusHours(1));
        String createdKey = TimeUtils.getTimestampStringFromTimezone(timestamp(start), sydney);
        RecurrenceData recurrenceData = RecurrenceData.builder()
                .recurrenceEnabled(true)
                .createDaysBefore(0)
                .frequency(RecurrenceData.Frequency.WEEKLY)
                .recurrenceAmount(1)
                .allRecurrences(List.of(timestamp(ZonedDateTime.of(2026, 10, 5, 10, 0, 0, 0, sydney))))
                .build();

        Timestamp selected = RecurringEventsCronService.findNextRecurrenceToCreate(
                recurrenceData, Map.of(createdKey, "already-created"), LocalDate.of(2026, 10, 5), true, event);

        ZonedDateTime selectedLocal = inZone(selected, sydney);
        Assert.assertEquals(LocalDateTime.of(2026, 10, 5, 9, 0), selectedLocal.toLocalDateTime());
        Assert.assertEquals(ZoneOffset.ofHours(11), selectedLocal.getOffset());
    }

    @Test
    public void oldUtcSteppedKeyDoesNotCreateASecondEvent() {
        ZoneId sydney = ZoneId.of("Australia/Sydney");
        ZonedDateTime start = ZonedDateTime.of(2026, 9, 28, 9, 0, 0, 0, sydney);
        ZonedDateTime badNext = ZonedDateTime.of(2026, 10, 5, 10, 0, 0, 0, sydney);
        NewEventData event = eventWithClock(sydney, start, start.plusHours(1), start.minusHours(1));
        Map<String, String> past = Map.of(
                TimeUtils.getTimestampStringFromTimezone(timestamp(start), sydney), "first-event",
                TimeUtils.getTimestampStringFromTimezone(timestamp(badNext), sydney), "already-created");
        RecurrenceData recurrenceData = RecurrenceData.builder()
                .recurrenceEnabled(true)
                .createDaysBefore(1)
                .frequency(RecurrenceData.Frequency.WEEKLY)
                .recurrenceAmount(1)
                .allRecurrences(List.of(timestamp(badNext)))
                .build();

        Timestamp selected = RecurringEventsCronService.findNextRecurrenceToCreate(
                recurrenceData, past, LocalDate.of(2026, 10, 4), true, event);

        Assert.assertNull(selected);
    }

    @Test
    public void legacyMonthlySaveThenCronDoesNotRecreateTheMarchOccurrence() {
        ZoneId sydney = ZoneId.of("Australia/Sydney");
        Timestamp start = timestamp(ZonedDateTime.of(2027, 3, 1, 9, 0, 0, 0, sydney));
        List<Timestamp> legacy = legacyUtcSchedule(start, RecurrenceData.Frequency.MONTHLY, 2);
        Assert.assertEquals(LocalDateTime.of(2027, 3, 29, 9, 0), inSydney(legacy.get(1)).toLocalDateTime());
        Assert.assertEquals(ZoneOffset.ofHours(11), inSydney(legacy.get(1)).getOffset());

        Map<String, String> past = Map.of(
                TimeUtils.getTimestampStringFromTimezone(legacy.get(0), sydney), "anchor-event",
                TimeUtils.getTimestampStringFromTimezone(legacy.get(1), sydney), "march-event");
        List<Timestamp> reconciled = RecurringEventsService.scheduleRespectingCreatedOccurrences(
                start, RecurrenceData.Frequency.MONTHLY, 2, false, sydney, legacy, start, past);

        Assert.assertEquals(legacy.get(1), reconciled.get(0));
        ZonedDateTime corrected = inSydney(reconciled.get(1));
        Assert.assertEquals(LocalDateTime.of(2027, 5, 1, 9, 0), corrected.toLocalDateTime());
        Assert.assertEquals(ZoneOffset.ofHours(10), corrected.getOffset());

        NewEventData event = new NewEventData();
        event.setTimezone(sydney.getId());
        event.setStartDate(start);
        RecurrenceData recurrenceData = RecurrenceData.builder()
                .recurrenceEnabled(true)
                .createDaysBefore(1)
                .frequency(RecurrenceData.Frequency.MONTHLY)
                .recurrenceAmount(2)
                .allRecurrences(reconciled)
                .pastRecurrences(past)
                .build();

        Assert.assertNull(RecurringEventsCronService.findNextRecurrenceToCreate(
                recurrenceData, past, LocalDate.of(2027, 3, 31), false, event));
        Timestamp later = RecurringEventsCronService.findNextRecurrenceToCreate(
                recurrenceData, past, LocalDate.of(2027, 4, 30), false, event);
        Assert.assertEquals(reconciled.get(1), later);
        Assert.assertEquals(LocalDateTime.of(2027, 5, 1, 9, 0), inSydney(later).toLocalDateTime());
    }

    @Test
    public void legacyWeeklyAutumnSaveThenCronDoesNotRecreateTheShiftedOccurrence() {
        ZoneId sydney = ZoneId.of("Australia/Sydney");
        // 00:30 is early enough that the autumn fallback moves a UTC week-step onto the previous Sydney date.
        Timestamp start = timestamp(ZonedDateTime.of(2027, 4, 3, 0, 30, 0, 0, sydney));
        List<Timestamp> legacy = legacyUtcSchedule(start, RecurrenceData.Frequency.WEEKLY, 2);
        List<Timestamp> wallClock = RecurringEventsService.calculateAllRecurrenceDates(
                start, RecurrenceData.Frequency.WEEKLY, 2, true, sydney);
        Assert.assertEquals(LocalDate.of(2027, 4, 9), inSydney(legacy.get(1)).toLocalDate());
        Assert.assertEquals(LocalDate.of(2027, 4, 10), inSydney(wallClock.get(1)).toLocalDate());

        Map<String, String> past = Map.of(
                TimeUtils.getTimestampStringFromTimezone(legacy.get(0), sydney), "anchor-event",
                TimeUtils.getTimestampStringFromTimezone(legacy.get(1), sydney), "created-event");
        List<Timestamp> reconciled = RecurringEventsService.scheduleRespectingCreatedOccurrences(
                start, RecurrenceData.Frequency.WEEKLY, 2, false, sydney, legacy, start, past);

        Assert.assertEquals(legacy.get(1), reconciled.get(0));
        Assert.assertEquals(LocalDateTime.of(2027, 4, 17, 0, 30), inSydney(reconciled.get(1)).toLocalDateTime());
        Assert.assertEquals(ZoneOffset.ofHours(10), inSydney(reconciled.get(1)).getOffset());

        NewEventData event = new NewEventData();
        event.setTimezone(sydney.getId());
        event.setStartDate(start);
        RecurrenceData recurrenceData = RecurrenceData.builder()
                .recurrenceEnabled(true)
                .createDaysBefore(0)
                .frequency(RecurrenceData.Frequency.WEEKLY)
                .recurrenceAmount(2)
                .allRecurrences(reconciled)
                .pastRecurrences(past)
                .build();

        Assert.assertNull(RecurringEventsCronService.findNextRecurrenceToCreate(
                recurrenceData, past, LocalDate.of(2027, 4, 10), false, event));
        Timestamp later = RecurringEventsCronService.findNextRecurrenceToCreate(
                recurrenceData, past, LocalDate.of(2027, 4, 17), false, event);
        Assert.assertEquals(reconciled.get(1), later);
    }

    @Test
    public void perthNineAmBecomesBookableOnTheVenueSunday() {
        ZoneId perth = ZoneId.of("Australia/Perth");
        ZonedDateTime start = ZonedDateTime.of(2026, 10, 5, 9, 0, 0, 0, perth);
        NewEventData event = new NewEventData();
        event.setTimezone(perth.getId());
        event.setStartDate(timestamp(start));
        RecurrenceData recurrenceData = RecurrenceData.builder()
                .recurrenceEnabled(true)
                .createDaysBefore(1)
                .frequency(RecurrenceData.Frequency.WEEKLY)
                .recurrenceAmount(0)
                .allRecurrences(List.of())
                .build();

        Assert.assertNull(RecurringEventsCronService.findNextRecurrenceToCreate(
                recurrenceData, Map.of(), LocalDate.of(2026, 10, 4), false, event));
        Assert.assertEquals(timestamp(start), RecurringEventsCronService.findNextRecurrenceToCreate(
                recurrenceData, Map.of(), LocalDate.of(2026, 10, 5), false, event));
    }

    @Test
    public void brisbaneNineAmBecomesBookableOnTheVenueSunday() {
        ZoneId brisbane = ZoneId.of("Australia/Brisbane");
        ZonedDateTime start = ZonedDateTime.of(2026, 10, 5, 9, 0, 0, 0, brisbane);
        NewEventData event = new NewEventData();
        event.setTimezone(brisbane.getId());
        event.setStartDate(timestamp(start));
        RecurrenceData recurrenceData = RecurrenceData.builder()
                .recurrenceEnabled(true)
                .createDaysBefore(1)
                .frequency(RecurrenceData.Frequency.WEEKLY)
                .recurrenceAmount(0)
                .allRecurrences(List.of())
                .build();

        // Saturday midnight Sydney is still Saturday in Brisbane, so the Monday session is not due.
        Assert.assertNull(RecurringEventsCronService.findNextRecurrenceToCreate(
                recurrenceData, Map.of(), LocalDate.of(2026, 10, 3), false, event));
        // Sunday midnight Sydney is still AEST, the same offset as Brisbane, so this is the venue Sunday.
        Assert.assertEquals(timestamp(start), RecurringEventsCronService.findNextRecurrenceToCreate(
                recurrenceData, Map.of(), LocalDate.of(2026, 10, 4), false, event));
    }

    @Test
    public void movedPinKeepsWallClockWhenTheInstantWasNotRetyped() {
        ZoneId sydney = ZoneId.of("Australia/Sydney");
        ZoneId brisbane = ZoneId.of("Australia/Brisbane");
        ZonedDateTime start = ZonedDateTime.of(2026, 10, 5, 9, 0, 0, 0, sydney);
        ZonedDateTime end = start.plusHours(2);
        ZonedDateTime deadline = ZonedDateTime.of(2026, 10, 4, 9, 0, 0, 0, sydney);
        NewEventData previous = eventWithClock(sydney, start, end, deadline);
        previous.setLocationLatLng(coordinates(-33.8688, 151.2093));
        NewEventData incoming = eventWithClock(sydney, start, end, deadline);
        incoming.setLocationLatLng(coordinates(-27.4698, 153.0251));

        EventTimeZone.retainWallClockIfPinMoved(previous, incoming);

        Assert.assertEquals(LocalDateTime.of(2026, 10, 5, 9, 0), inZone(incoming.getStartDate(), brisbane).toLocalDateTime());
        Assert.assertEquals(LocalDateTime.of(2026, 10, 5, 11, 0), inZone(incoming.getEndDate(), brisbane).toLocalDateTime());
        Assert.assertEquals(LocalDateTime.of(2026, 10, 4, 9, 0), inZone(incoming.getRegistrationDeadline(), brisbane).toLocalDateTime());

        NewEventData retyped = eventWithClock(brisbane,
                ZonedDateTime.of(2026, 10, 5, 9, 0, 0, 0, brisbane),
                ZonedDateTime.of(2026, 10, 5, 11, 0, 0, 0, brisbane),
                ZonedDateTime.of(2026, 10, 4, 9, 0, 0, 0, brisbane));
        retyped.setLocationLatLng(coordinates(-27.4698, 153.0251));
        Timestamp retypedStart = retyped.getStartDate();
        EventTimeZone.retainWallClockIfPinMoved(previous, retyped);
        Assert.assertEquals(retypedStart, retyped.getStartDate());
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
