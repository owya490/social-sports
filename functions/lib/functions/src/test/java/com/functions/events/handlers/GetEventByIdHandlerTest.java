package com.functions.events.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.fail;

import java.util.Optional;

import org.junit.Test;

import com.functions.events.models.EventData;
import com.functions.events.models.requests.GetEventByIdRequest;
import com.functions.global.exceptions.NotFoundException;
import com.functions.global.models.AuthContext;

public class GetEventByIdHandlerTest {

    @Test
    public void returnsActivePublicEvent() {
        EventData event = eventWithStatus(true, false);

        EventData result = handlerWith(Optional.of(event))
                .handle(new GetEventByIdRequest("event-1"), AuthContext.anonymous()).event();

        assertSame(event, result);
    }

    @Test(expected = NotFoundException.class)
    public void reportsUnavailableEventAsNotFound() {
        handlerWith(Optional.empty()).handle(new GetEventByIdRequest("event-1"), AuthContext.anonymous());
    }

    @Test
    public void rejectsInconsistentActivePublicEvent() {
        Boolean[][] statuses = {
                {false, false},
                {null, false},
                {true, true},
                {true, null}
        };

        for (Boolean[] status : statuses) {
            try {
                handlerWith(Optional.of(eventWithStatus(status[0], status[1])))
                        .handle(new GetEventByIdRequest("event-1"), AuthContext.anonymous());
                fail("Expected an inconsistent event status to fail");
            } catch (IllegalStateException expected) {
                assertEquals("Event at active public path has inconsistent status: event-1", expected.getMessage());
            }
        }
    }

    @Test(expected = IllegalStateException.class)
    public void propagatesRepositoryFailure() {
        GetEventByIdHandler handler = new GetEventByIdHandler() {
            @Override
            protected Optional<EventData> find(String ignored) {
                throw new IllegalStateException("Firestore unavailable");
            }
        };

        handler.handle(new GetEventByIdRequest("event-1"), AuthContext.anonymous());
    }

    @Test(expected = IllegalArgumentException.class)
    public void rejectsBlankEventId() {
        new GetEventByIdHandler().handle(new GetEventByIdRequest(" "), AuthContext.anonymous());
    }

    private GetEventByIdHandler handlerWith(Optional<EventData> event) {
        return new GetEventByIdHandler() {
            @Override
            protected Optional<EventData> find(String ignored) {
                return event;
            }
        };
    }

    private EventData eventWithStatus(Boolean isActive, Boolean isPrivate) {
        EventData event = new EventData();
        event.setIsActive(isActive);
        event.setIsPrivate(isPrivate);
        return event;
    }
}
