package com.functions.utils.logging;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.OutputStream;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.google.cloud.functions.HttpResponse;

public class StatusTrackingHttpResponse implements HttpResponse {
    private final HttpResponse delegate;
    private int statusCode;

    public StatusTrackingHttpResponse(HttpResponse delegate, int defaultStatusCode) {
        this.delegate = delegate;
        this.statusCode = defaultStatusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getStatusCodeString() {
        return String.valueOf(statusCode);
    }

    @Override
    public void setStatusCode(int code) {
        statusCode = code;
        delegate.setStatusCode(code);
    }

    @Override
    public void setStatusCode(int code, String message) {
        statusCode = code;
        delegate.setStatusCode(code, message);
    }

    @Override
    public void setContentType(String contentType) {
        delegate.setContentType(contentType);
    }

    @Override
    public Optional<String> getContentType() {
        return delegate.getContentType();
    }

    @Override
    public void appendHeader(String header, String value) {
        delegate.appendHeader(header, value);
    }

    @Override
    public Map<String, List<String>> getHeaders() {
        return delegate.getHeaders();
    }

    @Override
    public OutputStream getOutputStream() throws IOException {
        return delegate.getOutputStream();
    }

    @Override
    public BufferedWriter getWriter() throws IOException {
        return delegate.getWriter();
    }
}
