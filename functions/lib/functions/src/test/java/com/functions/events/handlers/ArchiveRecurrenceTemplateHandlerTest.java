package com.functions.events.handlers;

import static org.junit.Assert.assertEquals;

import java.util.Optional;

import org.junit.Test;

import com.functions.events.exceptions.RecurrenceTemplateNotFoundException;
import com.functions.events.models.NewEventData;
import com.functions.events.models.RecurrenceTemplate;
import com.functions.events.models.requests.ArchiveRecurrenceTemplateRequest;
import com.functions.events.models.responses.ArchiveRecurrenceTemplateResponse;
import com.functions.global.exceptions.AuthorizationException;
import com.functions.global.models.AuthContext;

public class ArchiveRecurrenceTemplateHandlerTest {

    @Test
    public void archivesTemplateOwnedByAuthenticatedOrganiser() throws Exception {
        ArchiveRecurrenceTemplateHandler handler = handlerWithTemplate("organiser-1");

        ArchiveRecurrenceTemplateResponse response = handler.handle(new ArchiveRecurrenceTemplateRequest("template-1"),
                AuthContext.authenticated("organiser-1"));

        assertEquals("template-1", response.recurrenceTemplateId());
    }

    @Test(expected = AuthorizationException.class)
    public void authorizesAgainstStoredOrganiser() throws Exception {
        handlerWithTemplate("organiser-1").handle(new ArchiveRecurrenceTemplateRequest("template-1"),
                AuthContext.authenticated("organiser-2"));
    }

    @Test(expected = RecurrenceTemplateNotFoundException.class)
    public void reportsMissingTemplateExplicitly() throws Exception {
        ArchiveRecurrenceTemplateHandler handler = new ArchiveRecurrenceTemplateHandler() {
            @Override
            protected Optional<RecurrenceTemplate> find(String ignored) {
                return Optional.empty();
            }
        };

        handler.handle(new ArchiveRecurrenceTemplateRequest("missing"), AuthContext.authenticated("organiser-1"));
    }

    @Test(expected = IllegalArgumentException.class)
    public void requiresTemplateId() throws Exception {
        handlerWithTemplate("organiser-1").handle(new ArchiveRecurrenceTemplateRequest("  "),
                AuthContext.authenticated("organiser-1"));
    }

    private ArchiveRecurrenceTemplateHandler handlerWithTemplate(String organiserId) {
        NewEventData storedEventData = new NewEventData();
        storedEventData.setOrganiserId(organiserId);
        RecurrenceTemplate template = RecurrenceTemplate.builder().eventData(storedEventData).build();

        return new ArchiveRecurrenceTemplateHandler() {
            @Override
            protected Optional<RecurrenceTemplate> find(String ignored) {
                return Optional.of(template);
            }

            @Override
            protected void archive(String ignored) {
            }
        };
    }
}
