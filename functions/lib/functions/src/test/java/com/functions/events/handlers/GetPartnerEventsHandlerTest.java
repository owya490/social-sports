package com.functions.events.handlers;

import static org.junit.Assert.assertSame;
import static org.junit.Assert.fail;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.times;

import java.util.List;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.events.models.requests.GetPartnerEventsRequest;
import com.functions.events.models.responses.GetPartnerEventsResponse;
import com.functions.events.services.EventsService;
import com.functions.global.exceptions.AuthenticationException;
import com.functions.global.models.AuthContext;
import com.functions.global.models.EndpointType;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.partners.models.PartnerContext;
import com.functions.utils.JavaUtils;

public class GetPartnerEventsHandlerTest {
    private static final String INTEGRATION = "test-partner";
    private static final String ORGANISER = "assigned-organiser";
    private static final AuthContext PARTNER = AuthContext.partner(
            new PartnerContext(INTEGRATION, ORGANISER, "https://partner.example"));
    private final GetPartnerEventsHandler handler = new GetPartnerEventsHandler();
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
    public void verifiedPartnerUsesServerOrganiserWithAbsentOrMatchingAssertion() throws Exception {
        GetPartnerEventsResponse response = new GetPartnerEventsResponse(List.of());
        events.when(() -> EventsService.getPublicPartnerEventsByOrganiser(ORGANISER))
                .thenReturn(response);

        for (String data : new String[] { "{}",
                "{\"partner\":\"test-partner\",\"organiserId\":\"other-organiser\"}" }) {
            assertSame(response, handler.handle(handler.parse(request(data)), PARTNER));
        }
        events.verify(() -> EventsService.getPublicPartnerEventsByOrganiser(ORGANISER), times(2));
        events.verifyNoMoreInteractions();
    }

    @Test
    public void rejectsMalformedAssertionsAndNonObjectDataBeforeReadingEvents() throws Exception {
        for (String data : new String[] {
                "{\"partner\":null}", "{\"partner\":\"\"}", "{\"partner\":\" \"}",
                "{\"partner\":1}", "{\"partner\":true}", "{\"partner\":[]}", "{\"partner\":{}}",
                "null", "[]", "1"
        }) {
            try {
                handler.parse(request(data));
                fail("Expected invalid partner assertion to fail");
            } catch (IllegalArgumentException expected) {
            }
        }
        events.verifyNoInteractions();
    }

    @Test
    public void rejectsMissingAndBlankTypedRequestBeforeReadingEvents() {
        for (GetPartnerEventsRequest request : new GetPartnerEventsRequest[] {
                null, new GetPartnerEventsRequest(" ")
        }) {
            try {
                handler.handle(request, PARTNER);
                fail("Expected invalid partner request to fail");
            } catch (IllegalArgumentException expected) {
            }
        }
        events.verifyNoInteractions();
    }

    @Test
    public void rejectsMismatchedAndInexactAssertionsBeforeReadingEvents() throws Exception {
        for (String partner : new String[] { "unknown", "TEST-PARTNER", "test-partner " }) {
            GetPartnerEventsRequest request = handler.parse(request("{\"partner\":\"" + partner + "\"}"));
            try {
                handler.handle(request, PARTNER);
                fail("Expected mismatched partner assertion to fail");
            } catch (IllegalArgumentException expected) {
            }
        }
        events.verifyNoInteractions();
    }

    @Test
    public void rejectsNonPartnerContextsBeforeReadingEvents() {
        for (AuthContext context : new AuthContext[] { AuthContext.anonymous(), AuthContext.authenticated("user") }) {
            try {
                handler.handle(new GetPartnerEventsRequest(null), context);
                fail("Expected partner context to be required");
            } catch (AuthenticationException expected) {
            }
        }
        events.verifyNoInteractions();
    }

    @Test
    public void propagatesServiceFailure() {
        IllegalStateException failure = new IllegalStateException("Firestore unavailable");
        events.when(() -> EventsService.getPublicPartnerEventsByOrganiser(ORGANISER))
                .thenThrow(failure);

        try {
            handler.handle(new GetPartnerEventsRequest(null), PARTNER);
            fail("Expected service failure to propagate");
        } catch (IllegalStateException expected) {
            assertSame(failure, expected);
        }
    }

    private UnifiedRequest request(String data) throws Exception {
        return new UnifiedRequest(EndpointType.GET_PARTNER_EVENTS, JavaUtils.objectMapper.readTree(data));
    }
}
