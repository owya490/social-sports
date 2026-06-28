package com.functions.stripe.controllers;

import static org.junit.Assert.assertTrue;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.logging.Handler;
import java.util.logging.Level;
import java.util.logging.LogRecord;
import java.util.logging.Logger;

import org.junit.Test;

import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

public class StripeWebhookEndpointTest {

    @Test
    public void service_logsCompletionForOptionsPreflight() throws Exception {
        CapturingLogHandler logHandler = new CapturingLogHandler();
        Logger logger = Logger.getLogger(StripeWebhookEndpoint.class.getName());
        Level originalLevel = logger.getLevel();
        logger.setLevel(Level.ALL);
        logger.addHandler(logHandler);

        try {
            TestHttpRequest request = new TestHttpRequest("OPTIONS", "/stripeWebhook", "");

            new StripeWebhookEndpoint((ignoredRequest, ignoredResponse) -> {
                throw new AssertionError("preflight should not invoke webhook processor");
            }).service(request, new TestHttpResponse());

            assertTrue(logHandler.messages().stream().anyMatch(message ->
                    message.contains("event=http_request_finish")
                            && message.contains("statusCode=204")));
        } finally {
            logger.removeHandler(logHandler);
            logger.setLevel(originalLevel);
        }
    }

    private static class CapturingLogHandler extends Handler {
        private final List<String> messages = new ArrayList<>();

        @Override
        public void publish(LogRecord record) {
            messages.add(record.getMessage());
        }

        @Override
        public void flush() {
        }

        @Override
        public void close() {
        }

        List<String> messages() {
            return messages;
        }
    }

    private static class TestHttpRequest implements HttpRequest {
        private final String method;
        private final String uri;
        private final byte[] body;
        private final Map<String, List<String>> headers = new HashMap<>();

        TestHttpRequest(String method, String uri, String body) {
            this.method = method;
            this.uri = uri;
            this.body = body.getBytes(StandardCharsets.UTF_8);
        }

        @Override
        public String getMethod() {
            return method;
        }

        @Override
        public String getUri() {
            return uri;
        }

        @Override
        public String getPath() {
            return URI.create(uri).getPath();
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
        public Optional<String> getContentType() {
            return Optional.empty();
        }

        @Override
        public long getContentLength() {
            return body.length;
        }

        @Override
        public Optional<String> getCharacterEncoding() {
            return Optional.of(StandardCharsets.UTF_8.name());
        }

        @Override
        public InputStream getInputStream() {
            return new ByteArrayInputStream(body);
        }

        @Override
        public BufferedReader getReader() {
            return new BufferedReader(new InputStreamReader(getInputStream(), StandardCharsets.UTF_8));
        }

        @Override
        public Map<String, List<String>> getHeaders() {
            return headers;
        }
    }

    private static class TestHttpResponse implements HttpResponse {
        private final Map<String, List<String>> headers = new HashMap<>();
        private final ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        private String contentType;

        @Override
        public void setStatusCode(int code) {
        }

        @Override
        public void setStatusCode(int code, String message) {
        }

        @Override
        public void setContentType(String contentType) {
            this.contentType = contentType;
        }

        @Override
        public Optional<String> getContentType() {
            return Optional.ofNullable(contentType);
        }

        @Override
        public void appendHeader(String header, String value) {
            headers.computeIfAbsent(header, ignored -> new ArrayList<>()).add(value);
        }

        @Override
        public Map<String, List<String>> getHeaders() {
            return headers;
        }

        @Override
        public OutputStream getOutputStream() {
            return outputStream;
        }

        @Override
        public BufferedWriter getWriter() throws IOException {
            return new BufferedWriter(new OutputStreamWriter(outputStream, StandardCharsets.UTF_8));
        }
    }
}
