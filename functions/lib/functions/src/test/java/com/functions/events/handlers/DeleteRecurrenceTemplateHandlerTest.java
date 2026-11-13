package com.functions.events.handlers;

import static org.junit.Assert.assertEquals;

import java.util.Optional;

import org.junit.Test;

import com.functions.events.exceptions.RecurrenceTemplateNotFoundException;
import com.functions.events.models.NewEventData;
import com.functions.events.models.RecurrenceTemplate;
import com.functions.events.models.requests.DeleteRecurrenceTemplateRequest;
import com.functions.events.models.responses.DeleteRecurrenceTemplateResponse;
import com.functions.global.exceptions.AuthorizationException;
import com.functions.global.models.AuthContext;

public class DeleteRecurrenceTemplateHandlerTest {

    @Test
    public void deletesTemplateOwnedByAuthenticatedOrganiser() throws Exception {
        DeleteRecurrenceTemplateHandler handler = handlerWithTemplate("organiser-1");

        DeleteRecurrenceTemplateResponse response = handler.handle(new DeleteRecurrenceTemplateRequest("template-1"),
                AuthContext.authenticated("organiser-1"));

        assertEquals("template-1", response.recurrenceTemplateId());
    }

    @Test(expected = AuthorizationException.class)
    public void authorizesAgainstStoredOrganiser() throws Exception {
        handlerWithTemplate("organiser-1").handle(new DeleteRecurrenceTemplateRequest("template-1"),
                AuthContext.authenticated("organiser-2"));
    }

    @Test(expected = RecurrenceTemplateNotFoundException.class)
    public void reportsMissingTemplateExplicitly() throws Exception {
        DeleteRecurrenceTemplateHandler handler = new DeleteRecurrenceTemplateHandler() {
            @Override
            protected Optional<RecurrenceTemplate> find(String ignored) {
                return Optional.empty();
            }
        };

        handler.handle(new DeleteRecurrenceTemplateRequest("missing"), AuthContext.authenticated("organiser-1"));
    }

    @Test(expected = IllegalArgumentException.class)
    public void requiresTemplateId() throws Exception {
        handlerWithTemplate("organiser-1").handle(new DeleteRecurrenceTemplateRequest("  "),
                AuthContext.authenticated("organiser-1"));
    }

    private DeleteRecurrenceTemplateHandler handlerWithTemplate(String organiserId) {
        NewEventData storedEventData = new NewEventData();
        storedEventData.setOrganiserId(organiserId);
        RecurrenceTemplate template = RecurrenceTemplate.builder().eventData(storedEventData).build();

        return new DeleteRecurrenceTemplateHandler() {
            @Override
            protected Optional<RecurrenceTemplate> find(String ignored) {
                return Optional.of(template);
            }

            @Override
            protected void delete(String ignoredTemplateId, String ignoredOrganiserId) {
            }
        };
    }
}
