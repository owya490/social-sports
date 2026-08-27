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

}
