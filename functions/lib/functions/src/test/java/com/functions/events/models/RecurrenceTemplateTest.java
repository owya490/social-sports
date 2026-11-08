package com.functions.events.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class RecurrenceTemplateTest {

    @Test
    public void archivedCopyStopsTheSeriesAndKeepsPrivacy() {
        NewEventData eventData = new NewEventData();
        eventData.setIsActive(true);
        eventData.setIsPrivate(true);
        eventData.setName("Friday social");
        RecurrenceData recurrenceData = RecurrenceData.builder()
                .frequency(RecurrenceData.Frequency.WEEKLY)
                .recurrenceEnabled(true)
                .build();

        RecurrenceTemplate archived = RecurrenceTemplate.builder()
                .eventData(eventData)
                .recurrenceData(recurrenceData)
                .build()
                .archivedCopy();

        assertEquals(Boolean.FALSE, archived.getEventData().getIsActive());
        assertEquals(Boolean.TRUE, archived.getEventData().getIsPrivate());
        assertEquals("Friday social", archived.getEventData().getName());
        assertEquals(Boolean.FALSE, archived.getRecurrenceData().getRecurrenceEnabled());
        assertEquals(RecurrenceData.Frequency.WEEKLY, archived.getRecurrenceData().getFrequency());
        assertTrue(archived.getArchived());
    }

    @Test
    public void archivedCopyLeavesAPublicSeriesPublic() {
        NewEventData eventData = new NewEventData();
        eventData.setIsActive(false);
        eventData.setIsPrivate(false);
        RecurrenceData recurrenceData = RecurrenceData.builder().recurrenceEnabled(false).build();

        RecurrenceTemplate archived = RecurrenceTemplate.builder()
                .eventData(eventData)
                .recurrenceData(recurrenceData)
                .archived(true)
                .build()
                .archivedCopy();

        assertFalse(archived.getEventData().getIsPrivate());
        assertTrue(archived.getArchived());
    }
}
