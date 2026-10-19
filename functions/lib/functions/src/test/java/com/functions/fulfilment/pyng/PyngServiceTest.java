package com.functions.fulfilment.pyng;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import com.fasterxml.jackson.databind.JsonNode;
import com.functions.events.models.EventData;
import com.functions.events.models.EventTicketType;
import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntityType;
import com.functions.fulfilment.models.fulfilmentEntities.PyngFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentSession.PyngCheckoutFulfilmentSession;
import com.functions.fulfilment.models.fulfilmentSession.PyngMetadata;
import com.functions.fulfilment.payment.PaymentStatus;
import com.functions.global.handlers.Global;
import com.functions.utils.JavaUtils;

public class PyngServiceTest {
    private static final String SESSION_ID = "11111111-1111-4111-8111-111111111111";
    private static final String RETURN_SIGNATURE = "XflWR0N8kPRnRLkJSGTMSLbDFrFyS6vKr5892WCLbYg";
    private static final Map<String, String> ENV = new HashMap<>();

    @Before
    public void setUp() {
        ENV.clear();
        ENV.put(PyngConfig.DEV_USERNAME, "partner-user");
        ENV.put(PyngConfig.DEV_PASSWORD, "partner-pass");
        ENV.put(PyngConfig.API_BASE_URL, "https://sample.pyng.com.au");
        ENV.put(PyngConfig.RETURN_BASE_URL, "https://www.sportshub.net.au");
        PyngConfig.env = ENV::get;
        PyngConfig.productionOverride = false;
        PyngService.client = PyngCheckoutClient.http();
        PyngService.continuation = null;
        PyngService.statusRecorder = null;
        PyngService.siteIds = session -> "site-1";
        PyngAccessToken.clear();
    }

    @After
    public void tearDown() {
        PyngConfig.env = Global::getEnv;
        PyngConfig.productionOverride = null;
        PyngService.client = PyngCheckoutClient.http();
        PyngService.continuation = null;
        PyngService.statusRecorder = null;
        PyngService.siteIds = null;
        PyngAccessToken.clear();
    }

    @Test
    public void createHostedCheckoutPostsCheckoutSession() throws Exception {
        AtomicReference<PyngCheckoutClient.Exchange> captured = new AtomicReference<>();
        PyngService.client = new PyngCheckoutClient(request -> {
            captured.set(request);
            return new PyngCheckoutClient.RawResponse(201, """
                    {"data":{"checkoutSessionId":"cs-1","launchUrl":"https://sample.pyng.com.au/launch/opaque","status":"Created","expiresAt":1,"orderId":"%s","siteId":"site-1"},"traceId":"trace-1","timestamp":1}
                    """.formatted(SESSION_ID));
        });

        PyngHostedCheckout checkout = PyngService.createHostedCheckout(session(null));

        assertEquals("cs-1", checkout.checkoutSessionId());
        assertEquals("https://sample.pyng.com.au/launch/opaque", checkout.hostedPageUrl());
        assertEquals("site-1", checkout.siteId());
        PyngCheckoutClient.Exchange request = captured.get();
        assertEquals("POST", request.method());
        assertEquals("https://sample.pyng.com.au/checkout/site-1/session", request.uri().toString());
        assertEquals("Bearer test-token", request.headers().get("Authorization"));
        assertEquals("application/json", request.headers().get("Content-Type"));
        assertEquals(SESSION_ID, request.headers().get("X-Pyng-Request-Id"));

        JsonNode body = JavaUtils.objectMapper.readTree(request.body());
        assertEquals(SESSION_ID, body.get("orderId").asText());
        assertEquals(3000, body.get("amount").asInt());
        assertEquals("https://www.sportshub.net.au/event/success/event-1",
                body.get("returnTarget").get("url").asText());
        assertTrue(body.get("metadata").get("fulfilmentSessionId").isTextual());
        assertEquals(SESSION_ID, body.get("metadata").get("fulfilmentSessionId").asText());
        assertEquals("event-1", body.get("metadata").get("eventId").asText());
        assertEquals("ticket-1", body.get("metadata").get("eventTicketTypeId").asText());
    }

    @Test
    public void createHostedCheckoutRequiresOrganiserSiteId() {
        PyngService.siteIds = session -> null;
        PyngService.client = new PyngCheckoutClient(request -> {
            fail("Pyng must not be called without a site id");
            return null;
        });

        try {
            PyngService.createHostedCheckout(session(null));
            fail("Expected IllegalStateException");
        } catch (IllegalStateException e) {
            assertTrue(e.getMessage().contains("site id"));
        }
    }

    @Test
    public void createHostedCheckoutRejectsNonPositiveAmount() {
        PyngService.client = new PyngCheckoutClient(request -> {
            fail("Pyng must not be called for a non-positive amount");
            return null;
        });
        PyngCheckoutFulfilmentSession checkout = session(null);
        checkout.getEventData().getEventTicketTypes().get("ticket-1").setPrice(0);

        try {
            PyngService.createHostedCheckout(checkout);
            fail("Expected IllegalArgumentException");
        } catch (IllegalArgumentException e) {
            assertTrue(e.getMessage().contains("cents"));
        }
    }

    @Test
    public void createHostedCheckoutSurfacesIdempotencyConflict() {
        PyngService.client = new PyngCheckoutClient(
                request -> new PyngCheckoutClient.RawResponse(409, "{\"message\":\"conflict\"}"));

        try {
            PyngService.createHostedCheckout(session(null));
            fail("Expected IllegalStateException");
        } catch (IllegalStateException e) {
            assertTrue(e.getMessage().contains("409"));
        }
    }

    @Test
    public void pollCheckoutReadsAuthoritativeStatus() throws Exception {
        PyngService.client = new PyngCheckoutClient(request -> {
            assertEquals("GET", request.method());
            assertEquals("https://sample.pyng.com.au/checkout/site-1/session/cs-1", request.uri().toString());
            assertEquals("Bearer test-token", request.headers().get("Authorization"));
            assertFalse(request.headers().containsKey("X-Pyng-Request-Id"));
            return new PyngCheckoutClient.RawResponse(200, """
                    {"data":{"checkoutSessionId":"cs-1","transactionStatus":"Settled","transactionId":"txn-1","orderId":"%s","amountPaid":3000},"traceId":"trace-2"}
                    """.formatted(SESSION_ID));
        });

        PaymentStatus status = PyngService.pollCheckout(session(PaymentStatus.PENDING).getPyngMetadata());

        assertEquals(PaymentStatus.SUCCEEDED, status);
    }

    @Test
    public void pollCheckoutReportsMissingSession() {
        PyngService.client = new PyngCheckoutClient(
                request -> new PyngCheckoutClient.RawResponse(404, "{\"message\":\"not found\"}"));

        try {
            PyngService.pollCheckout(session(PaymentStatus.PENDING).getPyngMetadata());
            fail("Expected IllegalStateException");
        } catch (IllegalStateException e) {
            assertTrue(e.getMessage().contains("404"));
        }
    }

    @Test
    public void mapTransactionStatusCoversCheckoutStatuses() {
        assertEquals(PaymentStatus.PENDING, PyngService.mapTransactionStatus("Pending"));
        assertEquals(PaymentStatus.PENDING, PyngService.mapTransactionStatus("InProgress"));
        assertEquals(PaymentStatus.SUCCEEDED, PyngService.mapTransactionStatus("Settled"));
        assertEquals(PaymentStatus.CANCELLED, PyngService.mapTransactionStatus("Declined"));
        assertEquals(PaymentStatus.EXPIRED, PyngService.mapTransactionStatus("Expired"));
        assertFalse(PaymentStatus.PENDING.isTerminal());
        assertTrue(PaymentStatus.SUCCEEDED.isTerminal());
        assertTrue(PaymentStatus.CANCELLED.isTerminal());
        assertTrue(PaymentStatus.EXPIRED.isTerminal());

        try {
            PyngService.mapTransactionStatus("Refunded");
            fail("Expected IllegalStateException");
        } catch (IllegalStateException e) {
            assertTrue(e.getMessage().contains("Refunded"));
        }
    }

    @Test
    public void refreshCheckoutContinuesWhenPaymentSettlesOrDoesNotComplete() throws Exception {
        Map<String, PaymentStatus> expected = Map.of(
                "Settled", PaymentStatus.SUCCEEDED,
                "Declined", PaymentStatus.CANCELLED,
                "Expired", PaymentStatus.EXPIRED);
        for (Map.Entry<String, PaymentStatus> outcome : expected.entrySet()) {
            AtomicReference<PaymentStatus> saved = new AtomicReference<>();
            AtomicInteger continuations = new AtomicInteger();
            PyngService.statusRecorder = (sessionId, metadata) -> saved.set(metadata.getStatus());
            PyngService.continuation = (sessionId, session) -> continuations.incrementAndGet();
            PyngService.client = clientReturning(outcome.getKey());

            PyngService.refreshCheckout(SESSION_ID, session(PaymentStatus.PENDING));

            assertEquals(outcome.getValue(), saved.get());
            assertEquals(outcome.getKey(), 1, continuations.get());
        }
    }

    @Test
    public void refreshCheckoutLeavesInProgressPaymentsAlone() throws Exception {
        AtomicInteger continuations = new AtomicInteger();
        AtomicInteger saves = new AtomicInteger();
        PyngService.continuation = (sessionId, session) -> continuations.incrementAndGet();
        PyngService.statusRecorder = (sessionId, metadata) -> saves.incrementAndGet();
        PyngService.client = clientReturning("Pending");

        PyngService.refreshCheckout(SESSION_ID, session(PaymentStatus.PENDING));

        assertEquals(0, continuations.get());
        assertEquals(0, saves.get());
        PyngService.client = clientReturning("InProgress");
        PyngService.refreshCheckout(SESSION_ID, session(PaymentStatus.PENDING));
        assertEquals(0, continuations.get());
        assertEquals(0, saves.get());
    }

    @Test
    public void refreshCheckoutContinuesAStoredTerminalStatus() throws Exception {
        AtomicInteger continuations = new AtomicInteger();
        PyngService.continuation = (sessionId, session) -> continuations.incrementAndGet();
        PyngService.client = new PyngCheckoutClient(request -> {
            fail("A terminal checkout must not be polled again before continuing");
            return null;
        });

        PyngService.refreshCheckout(SESSION_ID, session(PaymentStatus.EXPIRED));

        assertEquals(1, continuations.get());
    }

    @Test
    public void continueFulfilmentSkipsPendingPayment() throws Exception {
        AtomicInteger continuations = new AtomicInteger();
        PyngService.continuation = (sessionId, session) -> continuations.incrementAndGet();

        PyngService.continueFulfilment(SESSION_ID, session(PaymentStatus.PENDING));

        assertEquals(0, continuations.get());
    }

    @Test
    public void verifyReturnSignatureMatchesPyngWorkedExample() {
        ENV.put(PyngConfig.DEV_SIGNING_SECRET, "return-redirect-secret-sample");

        assertTrue(PyngService.verifyReturnSignature(SESSION_ID, "Settled", RETURN_SIGNATURE));
        assertFalse(PyngService.verifyReturnSignature(SESSION_ID, "Declined", RETURN_SIGNATURE));
        assertFalse(PyngService.verifyReturnSignature(SESSION_ID, "Settled", null));
    }

    @Test
    public void verifyReturnSignatureIgnoresSignatureWhenSecretIsUnset() {
        assertTrue(PyngService.verifyReturnSignature(SESSION_ID, "Settled", null));
        assertTrue(PyngService.verifyReturnSignature(SESSION_ID, "Settled", "not-a-signature"));
    }

    @Test
    public void accessTokenUsesClientCredentialsAndIsCached() throws Exception {
        AtomicInteger calls = new AtomicInteger();
        AtomicReference<PyngCheckoutClient.Exchange> captured = new AtomicReference<>();
        PyngCheckoutClient.Transport transport = request -> {
            calls.incrementAndGet();
            captured.set(request);
            return new PyngCheckoutClient.RawResponse(200, """
                    {"access_token":"tok","token_type":"Bearer","expires_in":3600,"scope":"urn:pyng:checkout:session:write"}
                    """);
        };

        assertEquals("tok", PyngAccessToken.bearer(transport, PyngConfig.SESSION_WRITE_SCOPE));
        PyngCheckoutClient.Exchange write = captured.get();
        assertEquals("tok", PyngAccessToken.bearer(transport, PyngConfig.SESSION_WRITE_SCOPE));
        assertEquals(1, calls.get());
        assertEquals("tok", PyngAccessToken.bearer(transport, PyngConfig.SESSION_READ_SCOPE));
        assertEquals(2, calls.get());

        assertEquals("POST", write.method());
        assertEquals("https://sample.pyng.com.au/checkout/oauth2/token", write.uri().toString());
        assertEquals("application/x-www-form-urlencoded", write.headers().get("Content-Type"));
        assertEquals("Basic " + Base64.getEncoder().encodeToString(
                "partner-user:partner-pass".getBytes(StandardCharsets.UTF_8)),
                write.headers().get("Authorization"));
        assertEquals("grant_type=client_credentials&scope="
                + "urn%3Apyng%3Acheckout%3Asession%3Awrite", write.body());
        assertEquals("grant_type=client_credentials&scope="
                + "urn%3Apyng%3Acheckout%3Asession%3Aread", captured.get().body());
        assertFalse(write.headers().containsKey("X-Pyng-Request-Id"));
    }

    @Test
    public void accessTokenDoesNotExposeCredentialsOnFailure() {
        try {
            PyngAccessToken.bearer(request -> new PyngCheckoutClient.RawResponse(401, """
                    {"error":"invalid_client","error_description":"Client authentication failed"}
                    """), PyngConfig.SESSION_WRITE_SCOPE);
            fail("Expected IllegalStateException");
        } catch (Exception e) {
            assertTrue(e.getMessage().contains("401"));
            assertFalse(e.getMessage().contains("partner-pass"));
        }
    }

    @Test
    public void metadataRejectsKeysOutsideThePyngContract() {
        Map<String, String> metadata = new HashMap<>();
        metadata.put("bad key", "value");

        try {
            PyngService.validateMetadata(metadata);
            fail("Expected IllegalArgumentException");
        } catch (IllegalArgumentException e) {
            assertTrue(e.getMessage().contains("metadata key"));
        }
    }

    private static PyngCheckoutClient clientReturning(String transactionStatus) {
        return new PyngCheckoutClient(request -> new PyngCheckoutClient.RawResponse(200, """
                {"data":{"checkoutSessionId":"cs-1","transactionStatus":"%s","orderId":"%s"},"traceId":"trace-1"}
                """.formatted(transactionStatus, SESSION_ID)));
    }

    private static PyngCheckoutFulfilmentSession session(PaymentStatus status) {
        EventData event = new EventData();
        event.setEventId("event-1");
        EventTicketType ticket = new EventTicketType();
        ticket.setId("ticket-1");
        ticket.setName("General Admission");
        ticket.setPrice(1500);
        event.setEventTicketTypes(Map.of("ticket-1", ticket));

        String entityId = "entity-1";
        PyngFulfilmentEntity entity = PyngFulfilmentEntity.builder().type(FulfilmentEntityType.PYNG).build();
        PyngMetadata metadata = status == null ? null : PyngMetadata.builder()
                .checkoutSessionId("cs-1")
                .hostedPageUrl("https://sample.pyng.com.au/launch/opaque")
                .siteId("site-1")
                .status(status)
                .build();

        return PyngCheckoutFulfilmentSession.builder()
                .id(SESSION_ID)
                .eventData(event)
                .numTickets(2)
                .eventTicketTypeId("ticket-1")
                .fulfilmentEntityIds(List.of(entityId))
                .fulfilmentEntityMap(Map.of(entityId, entity))
                .pyngMetadata(metadata)
                .build();
    }
}
