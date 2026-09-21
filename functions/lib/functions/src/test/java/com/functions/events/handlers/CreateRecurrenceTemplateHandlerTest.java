package com.functions.events.handlers;

import static org.junit.Assert.assertEquals;

import java.util.Map;
import java.util.Optional;

import org.junit.Test;

import com.functions.events.models.NewEventData;
import com.functions.events.models.NewRecurrenceData;
import com.functions.events.models.requests.CreateRecurrenceTemplateRequest;
import com.functions.events.models.responses.CreateRecurrenceTemplateResponse;
import com.functions.global.exceptions.AuthorizationException;
import com.functions.global.models.AuthContext;

public class CreateRecurrenceTemplateHandlerTest {

    @Test
    public void createsTemplateForAuthenticatedOrganiser() {
        NewEventData eventData = new NewEventData();
        eventData.setOrganiserId("organiser-1");
        CreateRecurrenceTemplateRequest request = new CreateRecurrenceTemplateRequest(eventData,
                new NewRecurrenceData());
        CreateRecurrenceTemplateHandler handler = new CreateRecurrenceTemplateHandler() {
            @Override
            protected Optional<Map.Entry<String, String>> create(CreateRecurrenceTemplateRequest ignored) {
                return Optional.of(Map.entry("template-1", "event-1"));
            }
        };

        CreateRecurrenceTemplateResponse response = handler.handle(request, AuthContext.authenticated("organiser-1"));

        assertEquals("template-1", response.recurrenceTemplateId());
        assertEquals("event-1", response.eventId());
    }

    @Test(expected = AuthorizationException.class)
    public void rejectsCreatingTemplateForAnotherOrganiser() {
        NewEventData eventData = new NewEventData();
        eventData.setOrganiserId("organiser-1");

        new CreateRecurrenceTemplateHandler().handle(
                new CreateRecurrenceTemplateRequest(eventData, new NewRecurrenceData()),
                AuthContext.authenticated("organiser-2"));
    }
}
