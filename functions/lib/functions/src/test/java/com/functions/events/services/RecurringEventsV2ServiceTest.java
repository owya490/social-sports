package com.functions.events.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.time.LocalDate;
import java.util.List;

import org.junit.Test;

import com.functions.events.models.RecurrenceData;
import com.functions.events.models.RecurrenceOccurrence;
import com.functions.utils.TimeUtils;
import com.google.cloud.Timestamp;

public class RecurringEventsV2ServiceTest {

    @Test
    public void normalizesCreateDateToSydneyMidnight() {
        Timestamp afternoon = eventStart(2026, 9, 10, 15);
        RecurrenceOccurrence occurrence = occurrence("occ-1", eventStart(2026, 9, 12, 10), afternoon, null);

        List<RecurrenceOccurrence> normalized = RecurringEventsV2Service.normalizeAndValidateOccurrences(
                List.of(occurrence));

        assertEquals(TimeUtils.sydneyStartOfDay(LocalDate.of(2026, 9, 10)), normalized.get(0).getCreateDate());
        assertEquals(LocalDate.of(2026, 9, 10), TimeUtils.toSydneyLocalDate(normalized.get(0).getCreateDate()));
    }

    @Test
    public void rejectsDuplicateEventDates() {
        try {
            RecurringEventsV2Service.normalizeAndValidateOccurrences(List.of(
                    occurrence("occ-1", eventStart(2026, 9, 12, 10), sydneyMidnight(2026, 9, 10), null),
                    occurrence("occ-2", eventStart(2026, 9, 12, 18), sydneyMidnight(2026, 9, 10), null)));
            fail("Expected duplicate event date to be rejected");
        } catch (IllegalArgumentException e) {
            assertTrue(e.getMessage().contains("Duplicate event date"));
        }
    }

    @Test
    public void rejectsCreateDateAfterEventStart() {
        try {
            RecurringEventsV2Service.normalizeAndValidateOccurrences(List.of(
                    occurrence("occ-1", eventStart(2026, 9, 10, 10), sydneyMidnight(2026, 9, 11), null)));
            fail("Expected createDate after eventStart to be rejected");
        } catch (IllegalArgumentException e) {
            assertTrue(e.getMessage().contains("createDate cannot be after eventStart"));
        }
    }

    @Test
    public void catchUpCreatesMissedOccurrenceOnALaterDay() {
        RecurrenceOccurrence missed = occurrence("occ-1", eventStart(2026, 9, 12, 10), sydneyMidnight(2026, 9, 10), null);
        RecurrenceOccurrence future = occurrence("occ-2", eventStart(2026, 9, 19, 10), sydneyMidnight(2026, 9, 17), null);
        RecurrenceData recurrenceData = RecurrenceData.builder()
                .recurrenceEnabled(true)
                .occurrences(List.of(missed, future))
                .build();

        RecurrenceOccurrence due = RecurringEventsV2Service.findNextOccurrenceToCreate(
                recurrenceData, LocalDate.of(2026, 9, 11));

        assertEquals("occ-1", due.getOccurrenceId());
    }

    @Test
    public void catchUpStillCreatesWhenEventStartIsInThePast() {
        RecurrenceOccurrence overdue = occurrence(
                "occ-1", eventStart(2026, 9, 8, 10), sydneyMidnight(2026, 9, 6), null);
        RecurrenceData recurrenceData = RecurrenceData.builder()
                .recurrenceEnabled(true)
                .occurrences(List.of(overdue))
                .build();

        RecurrenceOccurrence due = RecurringEventsV2Service.findNextOccurrenceToCreate(
                recurrenceData, LocalDate.of(2026, 9, 11));

        assertEquals("occ-1", due.getOccurrenceId());
    }

    @Test
    public void skipsAlreadyMaterializedOccurrences() {
        RecurrenceOccurrence created = occurrence(
                "occ-1", eventStart(2026, 9, 12, 10), sydneyMidnight(2026, 9, 10), "event-1");
        RecurrenceOccurrence pending = occurrence(
                "occ-2", eventStart(2026, 9, 19, 10), sydneyMidnight(2026, 9, 11), null);
        RecurrenceData recurrenceData = RecurrenceData.builder()
                .recurrenceEnabled(true)
                .occurrences(List.of(created, pending))
                .build();

        RecurrenceOccurrence due = RecurringEventsV2Service.findNextOccurrenceToCreate(
                recurrenceData, LocalDate.of(2026, 9, 11));

        assertEquals("occ-2", due.getOccurrenceId());
    }

    @Test
    public void doesNotSelectFutureCreateDates() {
        RecurrenceOccurrence future = occurrence(
                "occ-1", eventStart(2026, 9, 19, 10), sydneyMidnight(2026, 9, 17), null);
        RecurrenceData recurrenceData = RecurrenceData.builder()
                .recurrenceEnabled(true)
                .occurrences(List.of(future))
                .build();

        assertNull(RecurringEventsV2Service.findNextOccurrenceToCreate(
                recurrenceData, LocalDate.of(2026, 9, 11)));
    }

    @Test
    public void keepsTemplateActiveWhilePendingOccurrencesRemain() {
        RecurrenceData recurrenceData = RecurrenceData.builder()
                .recurrenceEnabled(true)
                .occurrences(List.of(
                        occurrence("occ-1", eventStart(2026, 9, 12, 10), sydneyMidnight(2026, 9, 10), "event-1"),
                        occurrence("occ-2", eventStart(2026, 9, 19, 10), sydneyMidnight(2026, 9, 17), null)))
                .build();

        assertFalse(RecurringEventsV2Service.shouldMoveTemplateToInactive(recurrenceData));
    }

    @Test
    public void movesTemplateInactiveWhenEveryOccurrenceIsCreated() {
        RecurrenceData recurrenceData = RecurrenceData.builder()
                .recurrenceEnabled(true)
                .occurrences(List.of(
                        occurrence("occ-1", eventStart(2026, 9, 12, 10), sydneyMidnight(2026, 9, 10), "event-1")))
                .build();

        assertTrue(RecurringEventsV2Service.shouldMoveTemplateToInactive(recurrenceData));
    }

    @Test
    public void updateCannotRemoveCreatedOccurrences() {
        List<RecurrenceOccurrence> existing = List.of(
                occurrence("occ-1", eventStart(2026, 9, 12, 10), sydneyMidnight(2026, 9, 10), "event-1"),
                occurrence("occ-2", eventStart(2026, 9, 19, 10), sydneyMidnight(2026, 9, 17), null));
        try {
            RecurringEventsV2Service.mergeOccurrencesForUpdate(existing, List.of(existing.get(1)));
            fail("Expected created occurrence removal to be rejected");
        } catch (IllegalArgumentException e) {
            assertTrue(e.getMessage().contains("cannot be removed"));
        }
    }

    @Test
    public void updateCannotChangeCreatedEventStart() {
        RecurrenceOccurrence created = occurrence(
                "occ-1", eventStart(2026, 9, 12, 10), sydneyMidnight(2026, 9, 10), "event-1");
        RecurrenceOccurrence mutated = occurrence(
                "occ-1", eventStart(2026, 9, 12, 18), sydneyMidnight(2026, 9, 10), "event-1");
        try {
            RecurringEventsV2Service.mergeOccurrencesForUpdate(List.of(created), List.of(mutated));
            fail("Expected created occurrence eventStart mutation to be rejected");
        } catch (IllegalArgumentException e) {
            assertTrue(e.getMessage().contains("eventStart cannot change"));
        }
    }

    @Test
    public void updateCanAddAndRemovePendingOccurrences() {
        RecurrenceOccurrence created = occurrence(
                "occ-1", eventStart(2026, 9, 12, 10), sydneyMidnight(2026, 9, 10), "event-1");
        RecurrenceOccurrence pending = occurrence(
                "occ-2", eventStart(2026, 9, 19, 10), sydneyMidnight(2026, 9, 17), null);
        RecurrenceOccurrence added = occurrence(
                "occ-3", eventStart(2026, 9, 26, 10), sydneyMidnight(2026, 9, 24), null);

        List<RecurrenceOccurrence> merged = RecurringEventsV2Service.mergeOccurrencesForUpdate(
                List.of(created, pending),
                List.of(created, added));

        assertEquals(2, merged.size());
        assertEquals("occ-1", merged.get(0).getOccurrenceId());
        assertEquals("event-1", merged.get(0).getEventId());
        assertEquals("occ-3", merged.get(1).getOccurrenceId());
        assertNull(merged.get(1).getEventId());
    }

    @Test
    public void eventIdForOccurrenceIsStableAndUnique() {
        String first = RecurringEventsV2Service.eventIdForOccurrence("occ-1");
        String second = RecurringEventsV2Service.eventIdForOccurrence("occ-1");
        String other = RecurringEventsV2Service.eventIdForOccurrence("occ-2");
        assertEquals(first, second);
        assertNotEquals(first, other);
        assertNotNull(first);
    }

    private static RecurrenceOccurrence occurrence(
            String occurrenceId,
            Timestamp eventStart,
            Timestamp createDate,
            String eventId) {
        return RecurrenceOccurrence.builder()
                .occurrenceId(occurrenceId)
                .eventStart(eventStart)
                .createDate(createDate)
                .eventId(eventId)
                .build();
    }

    private static Timestamp sydneyMidnight(int year, int month, int day) {
        return TimeUtils.sydneyStartOfDay(LocalDate.of(year, month, day));
    }

    private static Timestamp eventStart(int year, int month, int day, int hour) {
        return TimeUtils.convertZonedDateTimeToTimestamp(
                LocalDate.of(year, month, day).atTime(hour, 0).atZone(TimeUtils.SYDNEY_TIMEZONE));
    }
}
