package com.functions.global.controllers;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.Reader;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.Test;

import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

public class GlobalAppControllerTest {
    @Test
    public void shouldRouteToStripeWebhookRequiresFeatureFlagPostAndSignature() {
        MockHttpRequest signedPostRequest = new MockHttpRequest(
                "POST",
                Map.of("Stripe-Signature", List.of("sig_test_123")),
                "");

        assertTrue(GlobalAppController.shouldRouteToStripeWebhook(signedPostRequest, true));
        assertFalse(GlobalAppController.shouldRouteToStripeWebhook(signedPostRequest, false));
    }

    @Test
    public void shouldRouteToStripeWebhookRejectsUnsignedOrNonPostRequests() {
        MockHttpRequest unsignedPostRequest = new MockHttpRequest("POST", Map.of(), "");
        MockHttpRequest signedGetRequest = new MockHttpRequest(
                "GET",
                Map.of("Stripe-Signature", List.of("sig_test_123")),
                "");

        assertFalse(GlobalAppController.shouldRouteToStripeWebhook(unsignedPostRequest, true));
        assertFalse(GlobalAppController.shouldRouteToStripeWebhook(signedGetRequest, true));
    }

    private static final class MockHttpRequest implements HttpRequest {
        private final String method;
        private final Map<String, List<String>> headers;
        private final String body;

        private MockHttpRequest(String method, Map<String, List<String>> headers, String body) {
            this.method = method;
            this.headers = headers;
            this.body = body;
        }

        @Override
        public String getMethod() {
            return method;
        }

        @Override
        public String getUri() {
            return "/";
        }

        @Override
        public String getPath() {
            return "/";
        }

        @Override
        public Optional<String> getQuery() {
            return Optional.empty();
        }

        @Override
        public Map<String, List<String>> getQueryParameters() {
            return Map.of();
        }

        @Override
        public Map<String, HttpPart> getParts() {
            return Map.of();
        }

        @Override
        public BufferedReader getReader() {
            Reader reader = new StringReader(body);
            return new BufferedReader(reader);
        }

        @Override
        public InputStream getInputStream() {
            return new ByteArrayInputStream(body.getBytes(StandardCharsets.UTF_8));
        }

        @Override
        public Optional<String> getContentType() {
            return Optional.of("application/json");
        }

        @Override
        public long getContentLength() {
            return body.length();
        }

        @Override
        public Optional<String> getCharacterEncoding() {
            return Optional.of("UTF-8");
        }

        @Override
        public Map<String, List<String>> getHeaders() {
            return headers;
        }

        @Override
        public Optional<String> getFirstHeader(String header) {
            List<String> values = headers.get(header);
            if (values == null || values.isEmpty()) {
                return Optional.empty();
            }
            return Optional.ofNullable(values.get(0));
        }

    }
}
