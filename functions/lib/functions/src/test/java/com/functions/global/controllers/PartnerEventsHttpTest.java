package com.functions.global.controllers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.logging.Handler;
import java.util.logging.Level;
import java.util.logging.LogRecord;
import java.util.logging.Logger;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;

import com.fasterxml.jackson.databind.JsonNode;
import com.functions.events.repositories.EventsRepository;
import com.functions.global.handlers.HandlerRegistry;
import com.functions.global.services.AuthService;
import com.functions.global.testutils.FakeHttpRequest;
import com.functions.partners.models.PartnerIntegration;
import com.functions.partners.repositories.PartnerIntegrationRepository;
import com.functions.partners.services.PartnerIntegrationService;
import com.functions.stripe.config.StripeConfig;
import com.functions.utils.JavaUtils;
import com.functions.utils.environment.Environment;
import com.functions.utils.environment.EnvironmentUtils;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

public class PartnerEventsHttpTest {
    private static final String KEY = "partner-one." + "A".repeat(43);
    private static final String DIGEST = "68aa689dc8cc473bdc24bae7b501e446d7918796f277b896273ff8245ddadd13";
    private static final String ORIGIN = "https://partner.example";
    private static final String ORGANISER_ID = "owner-one";
    private MockedStatic<StripeConfig> stripe;
    private MockedStatic<EnvironmentUtils> environment;
    private MockedStatic<EventsRepository> events;
    private MockedStatic<PartnerIntegrationRepository> integrations;

    @Before
    public void setUp() {
        stripe = mockStatic(StripeConfig.class);
        environment = mockStatic(EnvironmentUtils.class);
        events = mockStatic(EventsRepository.class);
        integrations = mockStatic(PartnerIntegrationRepository.class);
        environment.when(EnvironmentUtils::getEnvironment).thenReturn(Environment.PRODUCTION);
        integrations.when(() -> PartnerIntegrationRepository.findById("partner-one"))
                .thenReturn(Optional.of(new PartnerIntegration(true, ORGANISER_ID, List.of(ORIGIN), List.of(DIGEST))));
        events.when(() -> EventsRepository.getActivePublicEventsByOrganiser(ORGANISER_ID)).thenReturn(List.of());
    }

    @After
    public void tearDown() {
        integrations.close();
        events.close();
        environment.close();
        stripe.close();
    }

    @Test
    public void protectedFeedUsesRegisteredOwnerAndReturnsExactOriginCors() throws Exception {
        Call result = call(feed("{}"), partnerHeaders(KEY, ORIGIN), 200);

        assertEquals(JavaUtils.objectMapper.readTree("{\"data\":{\"events\":[]}}"), result.body());
        assertPartnerCors(result.response());
        events.verify(() -> EventsRepository.getActivePublicEventsByOrganiser(ORGANISER_ID));
        integrations.verify(() -> PartnerIntegrationRepository.findById("partner-one"));
    }

    @Test
    public void assertionAndDependencyErrorsRetainVerifiedCorsAndSafeMessages() throws Exception {
        Call invalid = call(feed("{\"partner\":123}"), partnerHeaders(KEY, ORIGIN), 400);
        assertEquals("Invalid request data", invalid.body().get("errorMessage").asText());
        assertPartnerCors(invalid.response());
        Call mismatched = call(feed("{\"partner\":\"other-partner\"}"), partnerHeaders(KEY, ORIGIN), 400);
        assertPartnerCors(mismatched.response());
        events.verifyNoInteractions();

        events.when(() -> EventsRepository.getActivePublicEventsByOrganiser(ORGANISER_ID))
                .thenThrow(new IllegalStateException("private dependency detail"));
        Call failed = call(feed("{}"), partnerHeaders(KEY, ORIGIN), 500);
        assertEquals("Internal server error", failed.body().get("errorMessage").asText());
        assertPartnerCors(failed.response());
    }

    @Test
    public void keyAndOriginDenialsOmitAllowOriginAndDoNotRunTheFeed() throws Exception {
        Call missing = call(feed("{}"), Map.of("Origin", List.of(ORIGIN)), 401);
        assertEquals("Invalid partner key", missing.body().get("errorMessage").asText());
        assertDeniedCors(missing.response());
        integrations.verifyNoInteractions();

        Call denied = call(feed("{}"), partnerHeaders(KEY, "https://lookalike.example"), 403);
        assertEquals("Partner origin is not allowed", denied.body().get("errorMessage").asText());
        assertDeniedCors(denied.response());
        events.verifyNoInteractions();
    }

    @Test
    public void bothPartnerEndpointsRequireAdmissionBeforeParsingData() throws Exception {
        for (String endpoint : List.of("GET_PARTNER_EVENTS", "INIT_PARTNER_FULFILMENT_SESSION")) {
            for (String data : List.of("", ",\"data\":null", ",\"data\":{}")) {
                Call denied = call("{\"endpointType\":\"" + endpoint + "\"" + data + "}", Map.of(), 401);
                assertDeniedCors(denied.response());
            }
            Call wrongOrigin = call("{\"endpointType\":\"" + endpoint + "\"}",
                    partnerHeaders(KEY, "https://lookalike.example"), 403);
            assertDeniedCors(wrongOrigin.response());
        }
        events.verifyNoInteractions();
    }

    @Test
    public void recognizedPartnerEnvelopeErrorsRetainVerifiedCors() throws Exception {
        for (String endpoint : List.of("GET_PARTNER_EVENTS", "INIT_PARTNER_FULFILMENT_SESSION")) {
            for (String data : List.of("", ",\"data\":null", ",\"data\":[]")) {
                Call invalid = call("{\"endpointType\":\"" + endpoint + "\"" + data + "}",
                        partnerHeaders(KEY, ORIGIN), 400);
                assertEquals("Invalid request data", invalid.body().get("errorMessage").asText());
                assertPartnerCors(invalid.response());
            }
        }
        events.verifyNoInteractions();
    }

    @Test
    public void preflightIsBodylessAndDoesNotParseAuthenticateOrRoute() throws Exception {
        HttpRequest request = mock(HttpRequest.class);
        when(request.getMethod()).thenReturn("OPTIONS");
        HttpResponse response = mock(HttpResponse.class);
        try (MockedStatic<AuthService> authentication = mockStatic(AuthService.class);
                MockedStatic<HandlerRegistry> handlers = mockStatic(HandlerRegistry.class)) {
            new GlobalAppController().service(request, response);

            verify(response).setStatusCode(204);
            verify(response).appendHeader("Access-Control-Allow-Origin", "*");
            verify(response).appendHeader("Access-Control-Allow-Headers",
                    "Content-Type, Authorization, X-Sportshub-Partner-Key");
            verify(request, never()).getReader();
            verify(request, never()).getHeaders();
            verify(response, never()).getWriter();
            authentication.verifyNoInteractions();
            handlers.verifyNoInteractions();
            integrations.verifyNoInteractions();
            events.verifyNoInteractions();
        }
    }

    @Test
    public void malformedEnvelopesAndPartnerFailuresDoNotExposeInputOrDependencyDetails() throws Exception {
        List<LogRecord> records = new ArrayList<>();
        Logger logger = Logger.getLogger(GlobalAppController.class.getName());
        Handler capture = new Handler() {
            @Override public void publish(LogRecord record) { records.add(record); }
            @Override public void flush() { }
            @Override public void close() { }
        };
        logger.addHandler(capture);
        try {
            Call malformed = call("{\"endpointType\":\"private-input-canary\",\"data\":{}}", Map.of(), 400);
            assertEquals("Invalid request data", malformed.body().get("errorMessage").asText());
            Call missingData = call("{\"endpointType\":\"GET_PARTNER_EVENTS\"}", Map.of(), 401);
            assertDeniedCors(missingData.response());
            integrations.when(() -> PartnerIntegrationRepository.findById("partner-one"))
                    .thenThrow(new IllegalStateException("private-config-canary " + KEY));
            Call unavailable = call(feed("{}"), partnerHeaders(KEY, ORIGIN), 500);
            assertEquals("Internal server error", unavailable.body().get("errorMessage").asText());
            assertDeniedCors(unavailable.response());

            assertFalse(records.isEmpty());
            assertTrue(records.stream().anyMatch(record -> record.getLevel() == Level.SEVERE
                    && record.getMessage().contains("outcome=server_error")));
            assertTrue(records.stream().anyMatch(record -> record.getLevel() == Level.WARNING
                    && record.getMessage().contains("outcome=invalid_request")));
            for (LogRecord record : records) {
                assertFalse(record.getMessage().contains("private-input-canary"));
                assertFalse(record.getMessage().contains("private-config-canary"));
                assertFalse(record.getMessage().contains(KEY));
                assertNull(record.getThrown());
            }
        } finally {
            logger.removeHandler(capture);
        }
    }

    @Test
    public void publicFirebaseAndMethodResponsesKeepWildcardCorsWithAnIrrelevantPartnerHeader() throws Exception {
        events.when(() -> EventsRepository.getActivePublicEventsByOrganiser(anyString())).thenReturn(List.of());
        Call publicResult = call("{\"endpointType\":\"GET_SYRIO_EVENTS\",\"data\":{}}",
                partnerHeaders("bad-key", ORIGIN), 200);
        verify(publicResult.response()).appendHeader("Access-Control-Allow-Origin", "*");
        Call firebaseResult = call("{\"endpointType\":\"GET_ORDER\",\"data\":{}}",
                partnerHeaders("bad-key", ORIGIN), 401);
        verify(firebaseResult.response()).appendHeader("Access-Control-Allow-Origin", "*");
        for (String endpoint : List.of("GET_SYRIO_EVENTS", "GET_ORDER")) {
            Call invalid = call("{\"endpointType\":\"" + endpoint + "\"}",
                    partnerHeaders("bad-key", ORIGIN), 400);
            verify(invalid.response()).appendHeader("Access-Control-Allow-Origin", "*");
        }
        HttpRequest request = mock(HttpRequest.class);
        when(request.getMethod()).thenReturn("GET");
        HttpResponse response = mock(HttpResponse.class);
        when(response.getWriter()).thenReturn(new BufferedWriter(new StringWriter()));
        new GlobalAppController().service(request, response);
        verify(response).setStatusCode(405);
        verify(response).appendHeader("Allow", "POST");
        verify(response).appendHeader("Access-Control-Allow-Origin", "*");
        integrations.verifyNoInteractions();
    }

    private void assertPartnerCors(HttpResponse response) {
        verify(response).appendHeader("Access-Control-Allow-Origin", ORIGIN);
        verify(response, never()).appendHeader("Access-Control-Allow-Origin", "*");
        verify(response).appendHeader("Vary", "Origin");
        verify(response).appendHeader("Cache-Control", "no-store");
        verify(response, never()).appendHeader(eq("Access-Control-Allow-Credentials"), anyString());
    }

    private void assertDeniedCors(HttpResponse response) {
        verify(response, never()).appendHeader(eq("Access-Control-Allow-Origin"), anyString());
        verify(response, never()).appendHeader(eq("Vary"), anyString());
    }

    private String feed(String data) {
        return "{\"endpointType\":\"GET_PARTNER_EVENTS\",\"data\":" + data + "}";
    }

    private Map<String, List<String>> partnerHeaders(String key, String origin) {
        return FakeHttpRequest.withHeaders(PartnerIntegrationService.KEY_HEADER, key, "Origin", origin).getHeaders();
    }

    private Call call(String envelope, Map<String, List<String>> headers, int expectedStatus) throws Exception {
        HttpRequest request = mock(HttpRequest.class);
        when(request.getMethod()).thenReturn("POST");
        when(request.getHeaders()).thenReturn(headers);
        when(request.getReader()).thenReturn(new BufferedReader(new StringReader(envelope)));
        HttpResponse response = mock(HttpResponse.class);
        StringWriter body = new StringWriter();
        BufferedWriter writer = new BufferedWriter(body);
        when(response.getWriter()).thenReturn(writer);

        new GlobalAppController().service(request, response);
        writer.flush();

        verify(response).setStatusCode(expectedStatus);
        assertTrue(body.toString().startsWith("{"));
        return new Call(JavaUtils.objectMapper.readTree(body.toString()), response);
    }

    private record Call(JsonNode body, HttpResponse response) {
    }
}
