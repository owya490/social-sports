package com.functions.events.handlers;

import static org.junit.Assert.assertEquals;

import java.util.Optional;

import org.junit.Test;

import com.functions.events.exceptions.RecurrenceTemplateNotFoundException;
import com.functions.events.models.NewEventData;
import com.functions.events.models.NewRecurrenceData;
import com.functions.events.models.RecurrenceTemplate;
import com.functions.events.models.requests.UpdateRecurrenceTemplateRequest;
import com.functions.events.models.responses.UpdateRecurrenceTemplateResponse;
import com.functions.global.exceptions.AuthorizationException;
import com.functions.global.models.AuthContext;

public class UpdateRecurrenceTemplateHandlerTest {

    @Test
    public void updatesTemplateOwnedByAuthenticatedOrganiser() {
        UpdateRecurrenceTemplateHandler handler = handlerWithTemplate("organiser-1", Optional.of("template-1"));
        UpdateRecurrenceTemplateRequest request = new UpdateRecurrenceTemplateRequest("template-1", null,
                new NewRecurrenceData());

        UpdateRecurrenceTemplateResponse response = handler.handle(request, AuthContext.authenticated("organiser-1"));

        assertEquals("template-1", response.recurrenceTemplateId());
    }

    @Test(expected = AuthorizationException.class)
    public void authorizesAgainstStoredOrganiser() {
        NewEventData replacementData = new NewEventData();
        replacementData.setOrganiserId("organiser-2");

        handlerWithTemplate("organiser-1", Optional.of("template-1")).handle(
                new UpdateRecurrenceTemplateRequest("template-1", replacementData, null),
                AuthContext.authenticated("organiser-2"));
    }

    @Test(expected = AuthorizationException.class)
    public void rejectsChangingStoredOrganiser() {
        NewEventData replacementData = new NewEventData();
        replacementData.setOrganiserId("organiser-2");

        handlerWithTemplate("organiser-1", Optional.of("template-1")).handle(
                new UpdateRecurrenceTemplateRequest("template-1", replacementData, null),
                AuthContext.authenticated("organiser-1"));
    }

    @Test(expected = IllegalStateException.class)
    public void propagatesRepositoryFailures() {
        UpdateRecurrenceTemplateHandler handler = new UpdateRecurrenceTemplateHandler() {
            @Override
            protected Optional<RecurrenceTemplate> find(String ignored) {
                throw new IllegalStateException("Firestore unavailable");
            }
        };

        handler.handle(new UpdateRecurrenceTemplateRequest("template-1", null, new NewRecurrenceData()),
                AuthContext.authenticated("organiser-1"));
    }

    @Test(expected = RecurrenceTemplateNotFoundException.class)
    public void reportsMissingTemplateExplicitly() {
        UpdateRecurrenceTemplateHandler handler = new UpdateRecurrenceTemplateHandler() {
            @Override
            protected Optional<RecurrenceTemplate> find(String ignored) {
                return Optional.empty();
            }
        };

        handler.handle(new UpdateRecurrenceTemplateRequest("missing", null, new NewRecurrenceData()),
                AuthContext.authenticated("organiser-1"));
    }

    private UpdateRecurrenceTemplateHandler handlerWithTemplate(String organiserId, Optional<String> updateResult) {
        NewEventData storedEventData = new NewEventData();
        storedEventData.setOrganiserId(organiserId);
        RecurrenceTemplate template = RecurrenceTemplate.builder().eventData(storedEventData).build();

        return new UpdateRecurrenceTemplateHandler() {
            @Override
            protected Optional<RecurrenceTemplate> find(String ignored) {
                return Optional.of(template);
            }

            @Override
            protected Optional<String> update(UpdateRecurrenceTemplateRequest ignored) {
                return updateResult;
            }
        };
    }
}
