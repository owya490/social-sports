package com.functions.events.handlers;

import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.time.LocalDate;
import java.util.List;

import org.junit.Test;

import com.functions.events.models.NewEventData;
import com.functions.events.models.RecurrenceOccurrence;
import com.functions.events.models.requests.CreateRecurrenceTemplateV2Request;
import com.functions.events.models.requests.UpdateRecurrenceTemplateV2Request;
import com.functions.global.exceptions.AuthorizationException;
import com.functions.global.models.AuthContext;
import com.functions.utils.TimeUtils;

public class RecurringEventsV2HandlerAuthTest {

    @Test
    public void createRejectsMismatchedOrganiser() throws Exception {
        NewEventData eventData = new NewEventData();
        eventData.setOrganiserId("organiser-a");
        CreateRecurrenceTemplateV2Request request = new CreateRecurrenceTemplateV2Request(
                eventData,
                List.of(sampleOccurrence()),
                true,
                List.of());
        try {
            new CreateRecurrenceTemplateV2Handler().handle(request, AuthContext.authenticated("organiser-b"));
            fail("Expected AuthorizationException");
        } catch (AuthorizationException e) {
            assertTrue(e.getMessage().contains("another organiser"));
        }
    }

    @Test
    public void createRequiresEventData() throws Exception {
        try {
            new CreateRecurrenceTemplateV2Handler().handle(
                    new CreateRecurrenceTemplateV2Request(null, List.of(), true, List.of()),
                    AuthContext.authenticated("organiser-a"));
            fail("Expected IllegalArgumentException");
        } catch (IllegalArgumentException e) {
            assertTrue(e.getMessage().contains("eventData is required"));
        }
    }

    @Test
    public void updateRequiresTemplateId() throws Exception {
        try {
            new UpdateRecurrenceTemplateV2Handler().handle(
                    new UpdateRecurrenceTemplateV2Request(null, null, null, null, null),
                    AuthContext.authenticated("organiser-a"));
            fail("Expected IllegalArgumentException");
        } catch (IllegalArgumentException e) {
            assertTrue(e.getMessage().contains("recurrenceTemplateId is required"));
        }
    }

    private static RecurrenceOccurrence sampleOccurrence() {
        return RecurrenceOccurrence.builder()
                .occurrenceId("occ-1")
                .eventStart(TimeUtils.convertZonedDateTimeToTimestamp(
                        LocalDate.of(2026, 9, 12).atTime(10, 0).atZone(TimeUtils.SYDNEY_TIMEZONE)))
                .createDate(TimeUtils.sydneyStartOfDay(LocalDate.of(2026, 9, 10)))
                .build();
    }
}
