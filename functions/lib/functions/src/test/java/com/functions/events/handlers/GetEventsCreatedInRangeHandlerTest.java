package com.functions.events.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;

import java.util.List;

import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.events.models.EventData;
import com.functions.events.repositories.EventsRepository;
import com.functions.global.exceptions.AuthorizationException;
import com.functions.global.models.AuthContext;
import com.functions.global.models.requests.DateRangeRequest;
import com.google.cloud.Timestamp;

public class GetEventsCreatedInRangeHandlerTest {
    private static final String ALLOWED_ACCOUNT = "ZzuRS5v8hhWonnp2qdIOZG8R7f12";
    private static final Timestamp START = Timestamp.parseTimestamp("2026-11-01T00:00:00Z");
    private static final Timestamp END = Timestamp.parseTimestamp("2026-11-08T00:00:00Z");

    @Test
    public void returnsEventsForTheAllowedAccount() {
        EventData event = new EventData();
        try (MockedStatic<EventsRepository> events = mockStatic(EventsRepository.class)) {
            events.when(() -> EventsRepository.getEventsCreatedBetween(START, END)).thenReturn(List.of(event));

            assertEquals(List.of(event), new GetEventsCreatedInRangeHandler()
                    .handle(new DateRangeRequest(START, END), AuthContext.authenticated(ALLOWED_ACCOUNT))
                    .events());
        }
    }

    @Test
    public void rejectsAnyOtherSignedInUserBeforeReadingEvents() {
        try (MockedStatic<EventsRepository> events = mockStatic(EventsRepository.class)) {
            try {
                new GetEventsCreatedInRangeHandler().handle(
                        new DateRangeRequest(START, END), AuthContext.authenticated("someone-else"));
                fail("Expected another account to be denied");
            } catch (AuthorizationException expected) {
                events.verify(() -> EventsRepository.getEventsCreatedBetween(START, END), never());
            }
        }
    }
}
