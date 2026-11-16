package com.functions.fulfilment.pyng;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.functions.fulfilment.payment.PaymentStatus;
import com.functions.utils.JavaUtils;

/**
 * HTTP calls for Pay with Pyng Checkout Sessions.
 * POST /checkout/{siteId}/session and GET /checkout/{siteId}/session/{checkoutSessionId}.
 */
final class PyngCheckoutClient {
    private static final Logger logger = LoggerFactory.getLogger(PyngCheckoutClient.class);
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(20);

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();

    private final Transport transport;
    private final TokenSource tokens;

    PyngCheckoutClient(Transport transport) {
        this(transport, scope -> "test-token");
    }

    PyngCheckoutClient(Transport transport, TokenSource tokens) {
        this.transport = transport;
        this.tokens = tokens;
    }

    static PyngCheckoutClient http() {
        return new PyngCheckoutClient(PyngCheckoutClient::send, PyngAccessToken::bearer);
    }

    @FunctionalInterface
    interface TokenSource {
        String bearer(String scope) throws IOException;
    }

    record CreateCheckoutSession(
            String requestId,
            String orderId,
            int amountCents,
            String returnUrl,
            Map<String, String> metadata,
            String siteId) {
    }

    record Exchange(String method, URI uri, Map<String, String> headers, String body) {
    }

    record RawResponse(int statusCode, String body) {
    }

    @FunctionalInterface
    interface Transport {
        RawResponse exchange(Exchange request) throws IOException;
    }

    PyngHostedCheckout createSession(CreateCheckoutSession command) throws IOException {
        URI uri = URI.create(PyngConfig.apiBaseUrl() + "/checkout/" + encode(command.siteId()) + "/session");
        ObjectNode body = JavaUtils.objectMapper.createObjectNode();
        body.put("orderId", command.orderId());
        body.put("amount", command.amountCents());
        body.putObject("returnTarget").put("url", command.returnUrl());
        if (command.metadata() != null && !command.metadata().isEmpty()) {
            ObjectNode metadata = body.putObject("metadata");
            command.metadata().forEach(metadata::put);
        }

        RawResponse response = transport.exchange(new Exchange(
                "POST",
                uri,
                headers(command.requestId(), PyngConfig.SESSION_WRITE_SCOPE),
                JavaUtils.objectMapper.writeValueAsString(body)));
        if (response.statusCode() != 201) {
            throw apiError("create checkout session", response.statusCode(), response.body());
        }

        JsonNode root = readTree(response.body());
        JsonNode data = data(root);
        String checkoutSessionId = text(data, "checkoutSessionId");
        String launchUrl = text(data, "launchUrl");
        if (checkoutSessionId == null || launchUrl == null) {
            throw new IllegalStateException(
                    "Pyng create checkout session response is missing checkoutSessionId or launchUrl");
        }
        logger.info("Created Pyng checkout session {} for order {} site {} traceId {}",
                checkoutSessionId, command.orderId(), command.siteId(), text(root, "traceId"));
        return new PyngHostedCheckout(checkoutSessionId, launchUrl, command.siteId());
    }

    PaymentStatus getStatus(String siteId, String checkoutSessionId) throws IOException {
        URI uri = URI.create(PyngConfig.apiBaseUrl()
                + "/checkout/" + encode(siteId)
                + "/session/" + encode(checkoutSessionId));
        RawResponse response = transport.exchange(new Exchange(
                "GET", uri, headers(null, PyngConfig.SESSION_READ_SCOPE), null));
        if (response.statusCode() != 200) {
            throw apiError("get checkout session status", response.statusCode(), response.body());
        }

        JsonNode root = readTree(response.body());
        JsonNode data = data(root);
        String transactionStatus = text(data, "transactionStatus");
        PaymentStatus status = PyngService.mapTransactionStatus(transactionStatus);
        String transactionId = text(data, "transactionId");
        String traceId = text(root, "traceId");
        if ("Declined".equals(transactionStatus)) {
            // Human-readable failure description. Pyng includes it on Declined and omits it otherwise.
            logger.error("Pyng checkout session {} declined: {} transactionId {} orderId {} traceId {}",
                    checkoutSessionId, text(data, "transactionStatusDescription"), transactionId,
                    text(data, "orderId"), traceId);
        } else {
            logger.info("Pyng checkout session {} transactionStatus {} paymentStatus {} transactionId {} traceId {}",
                    checkoutSessionId, transactionStatus, status, transactionId, traceId);
        }
        return status;
    }

    private Map<String, String> headers(String requestId, String scope) throws IOException {
        Map<String, String> headers = new LinkedHashMap<>();
        headers.put("Content-Type", "application/json");
        headers.put("Accept", "application/json");
        headers.put("Authorization", "Bearer " + tokens.bearer(scope));
        if (requestId != null) {
            headers.put("X-Pyng-Request-Id", requestId);
        }
        return headers;
    }

    static RawResponse send(Exchange request) throws IOException {
        HttpRequest.Builder builder = HttpRequest.newBuilder(request.uri()).timeout(REQUEST_TIMEOUT);
        request.headers().forEach(builder::header);
        if ("GET".equals(request.method())) {
            builder.GET();
        } else {
            builder.method(request.method(),
                    HttpRequest.BodyPublishers.ofString(
                            request.body() == null ? "" : request.body(), StandardCharsets.UTF_8));
        }
        try {
            HttpResponse<String> response = HTTP.send(builder.build(),
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            return new RawResponse(response.statusCode(), response.body());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Pyng request interrupted", e);
        }
    }

    private static JsonNode readTree(String body) throws IOException {
        if (body == null || body.isBlank()) {
            throw new IllegalStateException("Pyng response body was empty");
        }
        return JavaUtils.objectMapper.readTree(body);
    }

    private static JsonNode data(JsonNode root) {
        JsonNode data = root.get("data");
        if (data == null || !data.isObject()) {
            throw new IllegalStateException("Pyng response is missing data");
        }
        return data;
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        String text = value.asText();
        if (text == null || text.isBlank()) {
            return null;
        }
        return text;
    }

    private static IllegalStateException apiError(String action, int status, String body) {
        String detail = body == null ? "" : body.replaceAll("\\s+", " ").trim();
        if (detail.length() > 300) {
            detail = detail.substring(0, 300);
        }
        return new IllegalStateException("Pyng " + action + " failed with status " + status
                + (detail.isEmpty() ? "" : ": " + detail));
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
