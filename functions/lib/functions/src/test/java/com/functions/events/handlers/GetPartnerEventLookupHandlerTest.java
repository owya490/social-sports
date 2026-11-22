package com.functions.events.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;
import static org.mockito.Mockito.mockStatic;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.events.models.responses.GetPartnerEventCollectionResponse;
import com.functions.events.models.responses.GetPartnerEventResponse;
import com.functions.events.models.responses.GetPartnerEventsResponse.PartnerEvent;
import com.functions.events.services.EventsService;
import com.functions.global.exceptions.AuthenticationException;
import com.functions.global.models.AuthContext;
import com.functions.global.models.EndpointType;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.partners.models.PartnerContext;
import com.functions.utils.JavaUtils;

public class GetPartnerEventLookupHandlerTest {
    private static final String ORGANISER = "assigned-organiser";
    private static final AuthContext PARTNER = AuthContext.partner(
            new PartnerContext("test-partner", ORGANISER, "https://partner.example"));
    private final GetPartnerEventHandler eventHandler = new GetPartnerEventHandler();
    private final GetPartnerEventCollectionHandler collectionHandler = new GetPartnerEventCollectionHandler();
    private MockedStatic<EventsService> events;

    @Before
    public void setUp() {
        events = mockStatic(EventsService.class);
    }

    @After
    public void tearDown() {
        events.close();
    }

    @Test
    public void usesTheServerOrganiserAndIgnoresAClientOrganiserId() throws Exception {
        GetPartnerEventResponse event = new GetPartnerEventResponse(sampleEvent());
        GetPartnerEventCollectionResponse collection = new GetPartnerEventCollectionResponse(
                "collection-1", "Friday games", "", null, java.util.List.of());
        events.when(() -> EventsService.getPublicPartnerEvent(ORGANISER, "event-1")).thenReturn(event);
        events.when(() -> EventsService.getPublicPartnerEventCollection(ORGANISER, "collection-1"))
                .thenReturn(collection);

        assertEquals(event, eventHandler.handle(eventHandler.parse(request(EndpointType.GET_PARTNER_EVENT,
                "{\"eventId\":\"event-1\",\"organiserId\":\"other-organiser\"}")), PARTNER));
        assertEquals(collection, collectionHandler.handle(collectionHandler.parse(request(
                EndpointType.GET_PARTNER_EVENT_COLLECTION,
                "{\"eventCollectionId\":\"collection-1\",\"partner\":\"test-partner\"}")), PARTNER));
    }

    @Test
    public void rejectsBlankIdsAndNonPartnerCallersBeforeReading() throws Exception {
        for (String data : new String[] { "{}", "{\"eventId\":\" \"}", "{\"eventId\":1}", "{\"partner\":1,\"eventId\":\"event-1\"}" }) {
            try {
                eventHandler.parse(request(EndpointType.GET_PARTNER_EVENT, data));
                fail("Expected invalid event request");
            } catch (IllegalArgumentException expected) {
            }
        }
        try {
            collectionHandler.handle(collectionHandler.parse(request(EndpointType.GET_PARTNER_EVENT_COLLECTION,
                    "{\"eventCollectionId\":\"collection-1\"}")), AuthContext.anonymous());
            fail("Expected a partner");
        } catch (AuthenticationException expected) {
        }
        events.verifyNoInteractions();
    }

    private PartnerEvent sampleEvent() {
        return new PartnerEvent("event-1", "Public event", "", "", null, null, null, null, null,
                java.util.List.of(), false, false, false, false, null, java.util.List.of(), java.util.List.of());
    }

    private UnifiedRequest request(EndpointType endpointType, String data) throws Exception {
        return new UnifiedRequest(endpointType, JavaUtils.objectMapper.readTree(data));
    }
}
