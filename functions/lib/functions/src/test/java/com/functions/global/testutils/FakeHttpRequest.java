package com.functions.global.testutils;

import java.io.BufferedReader;
import java.io.InputStream;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;

import com.google.cloud.functions.HttpRequest;

/**
 * Minimal {@link HttpRequest} for exercising header-based auth.
 * <p>
 * Header lookup is case-insensitive to mirror the real Functions Framework. This
 * matters: Cloud Run serves HTTP/2, which lowercases every header name, so
 * "Authorization" arrives as "authorization".
 */
public final class FakeHttpRequest implements HttpRequest {
    private final Map<String, List<String>> headers = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);

    public static FakeHttpRequest withHeaders(String... nameValuePairs) {
        if (nameValuePairs.length % 2 != 0) {
            throw new IllegalArgumentException("Expected header name/value pairs");
        }
        FakeHttpRequest request = new FakeHttpRequest();
        for (int i = 0; i < nameValuePairs.length; i += 2) {
            request.headers.put(nameValuePairs[i], List.of(nameValuePairs[i + 1]));
        }
        return request;
    }

    @Override
    public Map<String, List<String>> getHeaders() {
        return headers;
    }

    @Override
    public String getMethod() {
        return "POST";
    }

    @Override
    public String getUri() {
        return "https://example.test/globalAppController";
    }

    @Override
    public String getPath() {
        return "/globalAppController";
    }

    @Override
    public Optional<String> getQuery() {
        return Optional.empty();
    }

    @Override
    public Map<String, List<String>> getQueryParameters() {
        return Collections.emptyMap();
    }

    @Override
    public Map<String, HttpPart> getParts() {
        return Collections.emptyMap();
    }

    @Override
    public Optional<String> getContentType() {
        return Optional.of("application/json");
    }

    @Override
    public long getContentLength() {
        return 0;
    }

    @Override
    public Optional<String> getCharacterEncoding() {
        return Optional.of("UTF-8");
    }

    @Override
    public InputStream getInputStream() {
        return InputStream.nullInputStream();
    }

    @Override
    public BufferedReader getReader() {
        return new BufferedReader(new java.io.StringReader(""));
    }
}
