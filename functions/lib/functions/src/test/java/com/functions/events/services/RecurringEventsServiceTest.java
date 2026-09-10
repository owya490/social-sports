package com.functions.events.services;

import com.functions.events.models.Attendee;
import com.functions.events.models.NewEventData;
import com.functions.events.models.RecurrenceData;
import com.functions.utils.JavaUtils;
import com.google.cloud.Timestamp;
import org.junit.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Date;

public class RecurringEventsServiceTest {
    @Test
    public void testCalculateAllRecurrenceDates() {
        Timestamp startTime = Timestamp.of(Date.from(Instant.parse("2026-09-09T09:00:00Z")));
        RecurrenceData.Frequency frequency = RecurrenceData.Frequency.WEEKLY;
        int recurrenceAmount = 3;

        List<Timestamp> recurrenceDates = RecurringEventsService.calculateAllRecurrenceDates(
                startTime, frequency, recurrenceAmount);

        org.junit.Assert.assertEquals(List.of(
                startTime,
                Timestamp.of(Date.from(Instant.parse("2026-09-16T09:00:00Z"))),
                Timestamp.of(Date.from(Instant.parse("2026-09-23T09:00:00Z"))),
                Timestamp.of(Date.from(Instant.parse("2026-09-30T09:00:00Z")))), recurrenceDates);
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
                recurrenceData, Map.of(), LocalDate.of(2026, 8, 23), null);

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
                recurrenceData, Map.of(), LocalDate.of(2026, 8, 23), null);

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
                        recurrenceData, LocalDate.of(2026, 8, 24)));
    }

    @Test
    public void keepsFutureDisabledTemplateActive() {
        Timestamp recurrence = Timestamp.of(Date.from(Instant.parse("2026-08-23T09:00:00Z")));
        RecurrenceData recurrenceData = RecurrenceData.builder()
                .recurrenceEnabled(false)
                .createDaysBefore(0)
                .allRecurrences(List.of(recurrence))
                .build();

        org.junit.Assert.assertFalse(
                RecurringEventsCronService.shouldMoveTemplateToInactiveAfterNoCreation(
                        recurrenceData, LocalDate.of(2026, 8, 22)));
    }

    @Test
    public void targetedCreationDoesNotCreateTheNextFutureOccurrence() {
        Timestamp initialRecurrence = Timestamp.of(Date.from(Instant.parse("2026-09-09T09:00:00Z")));
        Timestamp futureRecurrence = Timestamp.of(Date.from(Instant.parse("2026-09-16T09:00:00Z")));
        RecurrenceData recurrenceData = RecurrenceData.builder()
                .recurrenceEnabled(true)
                .createDaysBefore(6)
                .allRecurrences(List.of(initialRecurrence, futureRecurrence))
                .pastRecurrences(Map.of("2026-09-09 19:00:00 GMT+10", "existing-event"))
                .build();

        Timestamp selectedRecurrence = RecurringEventsCronService.findNextRecurrenceToCreate(
                recurrenceData, recurrenceData.getPastRecurrences(), LocalDate.of(2026, 9, 4),
                initialRecurrence);

        org.junit.Assert.assertNull(selectedRecurrence);
    }

    @Test
    public void targetedCreationSelectsTheMissingInitialOccurrenceAfterItsCreationDate() {
        Timestamp initialRecurrence = Timestamp.of(Date.from(Instant.parse("2026-09-09T09:00:00Z")));
        RecurrenceData recurrenceData = RecurrenceData.builder()
                .recurrenceEnabled(true)
                .createDaysBefore(6)
                .allRecurrences(List.of(initialRecurrence))
                .pastRecurrences(Map.of())
                .build();

        Timestamp selectedRecurrence = RecurringEventsCronService.findNextRecurrenceToCreate(
                recurrenceData, recurrenceData.getPastRecurrences(), LocalDate.of(2026, 9, 12),
                initialRecurrence);

        org.junit.Assert.assertEquals(initialRecurrence, selectedRecurrence);
    }

    @Test
    public void targetedCreationDoesNotCreateDisabledRecurrences() {
        Timestamp initialRecurrence = Timestamp.of(Date.from(Instant.parse("2026-09-09T09:00:00Z")));
        RecurrenceData recurrenceData = RecurrenceData.builder()
                .recurrenceEnabled(false)
                .createDaysBefore(6)
                .allRecurrences(List.of(initialRecurrence))
                .pastRecurrences(Map.of())
                .build();

        Timestamp selectedRecurrence = RecurringEventsCronService.findNextRecurrenceToCreate(
                recurrenceData, recurrenceData.getPastRecurrences(), LocalDate.of(2026, 9, 12),
                initialRecurrence);

        org.junit.Assert.assertNull(selectedRecurrence);
    }

}
