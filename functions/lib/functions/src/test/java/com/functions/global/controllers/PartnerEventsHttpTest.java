package com.functions.global.controllers;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.List;

import org.junit.Test;
import org.mockito.MockedStatic;

import com.fasterxml.jackson.databind.JsonNode;
import com.functions.events.repositories.EventsRepository;
import com.functions.stripe.config.StripeConfig;
import com.functions.utils.JavaUtils;
import com.functions.utils.environment.Environment;
import com.functions.utils.environment.EnvironmentUtils;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

public class PartnerEventsHttpTest {
    private static final String ORGANISER_ID = "98PJNSoCmNU5zslxa1wIdZ3mPdf2";

    @Test
    public void publicFeedRoutesWithoutCredentialsAndWrapsSuccessfulEmptyResult() throws Exception {
        try (MockedStatic<StripeConfig> stripe = mockStatic(StripeConfig.class);
                MockedStatic<EnvironmentUtils> environment = mockStatic(EnvironmentUtils.class);
                MockedStatic<EventsRepository> repository = mockStatic(EventsRepository.class)) {
            environment.when(EnvironmentUtils::getEnvironment).thenReturn(Environment.PRODUCTION);
            repository.when(() -> EventsRepository.getActivePublicEventsByOrganiser(ORGANISER_ID))
                    .thenReturn(List.of());

            assertEquals(JavaUtils.objectMapper.readTree("{\"data\":{\"events\":[]}}"),
                    call("{\"partner\":\"syd-grass\"}", 200));
        }
    }

    @Test
    public void invalidAndUnknownSelectorsHaveDistinctClientErrors() throws Exception {
        try (MockedStatic<StripeConfig> stripe = mockStatic(StripeConfig.class)) {
            assertEquals("partner is required and must be a nonempty string",
                    call("{\"partner\":123}", 400).get("errorMessage").asText());
            assertEquals("Partner not found",
                    call("{\"partner\":\"unknown\"}", 404).get("errorMessage").asText());
        }
    }

    @Test
    public void dependencyFailureReturnsSanitizedServerError() throws Exception {
        try (MockedStatic<StripeConfig> stripe = mockStatic(StripeConfig.class);
                MockedStatic<EnvironmentUtils> environment = mockStatic(EnvironmentUtils.class);
                MockedStatic<EventsRepository> repository = mockStatic(EventsRepository.class)) {
            environment.when(EnvironmentUtils::getEnvironment).thenReturn(Environment.PRODUCTION);
            repository.when(() -> EventsRepository.getActivePublicEventsByOrganiser(ORGANISER_ID))
                    .thenThrow(new IllegalStateException("internal dependency detail"));

            assertEquals(JavaUtils.objectMapper.readTree("{\"errorMessage\":\"Internal server error\"}"),
                    call("{\"partner\":\"syd-grass\"}", 500));
        }
    }

    private JsonNode call(String data, int expectedStatus) throws Exception {
        HttpRequest request = mock(HttpRequest.class);
        when(request.getMethod()).thenReturn("POST");
        when(request.getReader()).thenReturn(new BufferedReader(new StringReader(
                "{\"endpointType\":\"GET_PARTNER_EVENTS\",\"data\":" + data + "}")));
        HttpResponse response = mock(HttpResponse.class);
        StringWriter body = new StringWriter();
        BufferedWriter writer = new BufferedWriter(body);
        when(response.getWriter()).thenReturn(writer);

        new GlobalAppController().service(request, response);
        writer.flush();

        verify(response).setStatusCode(expectedStatus);
        return JavaUtils.objectMapper.readTree(body.toString());
    }
}
