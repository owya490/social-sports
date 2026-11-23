package com.functions.emails.controllers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.BufferedWriter;
import java.io.StringWriter;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.emails.reminder.EmailReminderJob;
import com.functions.emails.reminder.EmailReminderResult;
import com.functions.stripe.config.StripeConfig;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

public class EmailReminderCronEndpointTest {
    private static final ZoneId SYDNEY = ZoneId.of("Australia/Sydney");
    private MockedStatic<StripeConfig> stripe;

    @Before
    public void setUp() {
        stripe = mockStatic(StripeConfig.class);
    }

    @After
    public void tearDown() {
        stripe.close();
    }

    @Test
    public void getRunsTomorrowInSydney() throws Exception {
        AtomicReference<LocalDate> requested = new AtomicReference<>();
        Clock clock = Clock.fixed(Instant.parse("2026-11-22T14:00:00Z"), SYDNEY);
        Exchange exchange = exchange("GET", clock, eventDate -> {
            requested.set(eventDate);
            return new EmailReminderResult(eventDate, List.of("event-1"), 2, 1);
        });

        assertEquals(LocalDate.of(2026, 11, 24), requested.get());
        verify(exchange.response()).setStatusCode(200);
        assertEquals("{\"eventDate\":\"2026-11-24\",\"events\":1,\"sent\":2,\"failed\":1}", exchange.body());
    }

    @Test
    public void postDoesNotRunTheJob() throws Exception {
        AtomicBoolean called = new AtomicBoolean(false);
        Exchange exchange = exchange("POST", Clock.system(SYDNEY), eventDate -> {
            called.set(true);
            return new EmailReminderResult(eventDate, List.of(), 0, 0);
        });

        assertFalse(called.get());
        verify(exchange.response()).setStatusCode(405);
    }

    @Test
    public void failedJobReturns500() throws Exception {
        Exchange exchange = exchange("GET", Clock.system(SYDNEY), eventDate -> {
            throw new IllegalStateException("firestore down");
        });

        verify(exchange.response()).setStatusCode(500);
        assertEquals("Email reminder pass failed: firestore down", exchange.body());
    }

    private static Exchange exchange(String method, Clock clock, EmailReminderJob job) throws Exception {
        StringWriter body = new StringWriter();
        BufferedWriter writer = new BufferedWriter(body);
        HttpRequest request = mock(HttpRequest.class);
        when(request.getMethod()).thenReturn(method);
        HttpResponse response = mock(HttpResponse.class);
        when(response.getWriter()).thenReturn(writer);
        new EmailReminderCronEndpoint(job, clock).service(request, response);
        writer.flush();
        return new Exchange(response, body.toString());
    }

    private record Exchange(HttpResponse response, String body) {
    }
}
