package com.functions.events.handlers;

import static org.junit.Assert.assertSame;
import static org.junit.Assert.fail;
import static org.mockito.Mockito.mockStatic;

import java.util.List;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.events.models.requests.GetPartnerEventsRequest;
import com.functions.events.models.responses.GetPartnerEventsResponse;
import com.functions.events.services.EventsService;
import com.functions.global.exceptions.NotFoundException;
import com.functions.global.models.AuthContext;
import com.functions.global.models.EndpointType;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;
import com.functions.utils.environment.Environment;
import com.functions.utils.environment.EnvironmentUtils;

public class GetPartnerEventsHandlerTest {
    private final GetPartnerEventsHandler handler = new GetPartnerEventsHandler();
    private MockedStatic<EventsService> events;
    private MockedStatic<EnvironmentUtils> environment;

    @Before
    public void setUp() {
        events = mockStatic(EventsService.class);
        environment = mockStatic(EnvironmentUtils.class);
        environment.when(EnvironmentUtils::getEnvironment).thenReturn(Environment.PRODUCTION);
    }

    @After
    public void tearDown() {
        environment.close();
        events.close();
    }

    @Test
    public void productionPartnerUsesServerOrganiserDespiteClientOverride() throws Exception {
        GetPartnerEventsResponse response = new GetPartnerEventsResponse(List.of());
        events.when(() -> EventsService.getPublicPartnerEventsByOrganiser("98PJNSoCmNU5zslxa1wIdZ3mPdf2"))
                .thenReturn(response);
        GetPartnerEventsRequest request = handler.parse(request(
                "{\"partner\":\"syd-grass\",\"organiserId\":\"other-organiser\"}"));

        assertSame(response, handler.handle(request, AuthContext.anonymous()));
        events.verify(() -> EventsService.getPublicPartnerEventsByOrganiser("98PJNSoCmNU5zslxa1wIdZ3mPdf2"));
        events.verifyNoMoreInteractions();
    }

    @Test
    public void rejectsMissingBlankAndNonStringSelectorsBeforeReadingEvents() throws Exception {
        for (String data : new String[] {
                "{}", "{\"partner\":null}", "{\"partner\":\"\"}", "{\"partner\":\" \"}",
                "{\"partner\":1}", "{\"partner\":true}", "{\"partner\":[]}", "{\"partner\":{}}",
                "null", "[]", "1"
        }) {
            try {
                handler.parse(request(data));
                fail("Expected invalid partner selector to fail");
            } catch (IllegalArgumentException expected) {
            }
        }
        events.verifyNoInteractions();
    }

    @Test
    public void rejectsMissingOrBlankTypedRequestBeforeReadingEvents() {
        for (GetPartnerEventsRequest request : new GetPartnerEventsRequest[] {
                null, new GetPartnerEventsRequest(null), new GetPartnerEventsRequest(" ")
        }) {
            try {
                handler.handle(request, AuthContext.anonymous());
                fail("Expected invalid partner request to fail");
            } catch (IllegalArgumentException expected) {
            }
        }
        events.verifyNoInteractions();
    }

    @Test
    public void reportsUnknownAndInexactSlugsAsNotFound() throws Exception {
        for (String partner : new String[] { "unknown", "SYD-GRASS", "syd-grass " }) {
            GetPartnerEventsRequest request = handler.parse(request("{\"partner\":\"" + partner + "\"}"));
            try {
                handler.handle(request, AuthContext.anonymous());
                fail("Expected unknown partner to fail");
            } catch (NotFoundException expected) {
            }
        }
        events.verifyNoInteractions();
    }

    @Test
    public void knownPartnerFailsClosedInDevelopmentAndUnknownEnvironment() {
        for (Environment target : new Environment[] { Environment.DEVELOPMENT, null }) {
            environment.when(EnvironmentUtils::getEnvironment).thenReturn(target);
            try {
                handler.handle(new GetPartnerEventsRequest("syd-grass"), AuthContext.anonymous());
                fail("Expected unconfigured partner environment to fail");
            } catch (IllegalStateException expected) {
            }
        }
        events.verifyNoInteractions();
    }

    @Test
    public void propagatesServiceFailure() {
        IllegalStateException failure = new IllegalStateException("Firestore unavailable");
        events.when(() -> EventsService.getPublicPartnerEventsByOrganiser("98PJNSoCmNU5zslxa1wIdZ3mPdf2"))
                .thenThrow(failure);

        try {
            handler.handle(new GetPartnerEventsRequest("syd-grass"), AuthContext.anonymous());
            fail("Expected service failure to propagate");
        } catch (IllegalStateException expected) {
            assertSame(failure, expected);
        }
    }

    private UnifiedRequest request(String data) throws Exception {
        return new UnifiedRequest(EndpointType.GET_PARTNER_EVENTS, JavaUtils.objectMapper.readTree(data));
    }
}
