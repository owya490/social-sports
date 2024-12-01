package com.functions.events.services;

import com.functions.events.models.Attendee;
import com.functions.events.models.NewEventData;
import com.functions.events.models.RecurrenceData;
import com.functions.utils.JavaUtils;
import com.google.cloud.Timestamp;
import org.junit.Test;

import java.time.Instant;
import java.util.Date;

public class RecurringEventsServiceTest {
    @Test
    public void testCalculateAllRecurrenceDates() {
        Timestamp startTime = Timestamp.of(Date.from(Instant.now()));
        RecurrenceData.Frequency frequency = RecurrenceData.Frequency.WEEKLY;
        Integer recurrenceAmount = 3;

        System.out.println(RecurringEventsService.calculateAllRecurrenceDates(startTime, frequency, recurrenceAmount, false));
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
}
